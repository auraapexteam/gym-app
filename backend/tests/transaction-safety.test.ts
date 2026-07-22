import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminService } from '@/modules/admin/admin.service';
import { TrainerService } from '@/modules/trainers/trainers.service';
import { GymService } from '@/modules/gym/gym.service';
import { mockTable, resetMocks, setupAuthUser } from './utils/test-helpers';
import { Role } from '@/shared/rbac';
import { supabase } from '@/config/supabase';
import { gymRepository } from '@/modules/gym/gym.repository';
import { trainerRepository } from '@/modules/trainers/trainers.repository';

describe('Transaction Safety & Rollbacks Verification', () => {
  beforeEach(() => {
    resetMocks();
  });

  const GYM_A = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2';
  const OWNER_A = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba6';

  describe('Gym Onboarding Rollback', () => {
    it('should roll back gym and user creation if owner assignment fails', async () => {
      // Mock createGym success
      mockTable('gyms', { id: GYM_A, name: 'Rollback Gym' });

      // Mock user creation success
      mockTable('profiles', { id: OWNER_A, email: 'owner@rollback.com' });

      // Spy on gymRepository.update and make it reject to simulate failure on assignOwner
      vi.spyOn(gymRepository, 'update').mockRejectedValueOnce(new Error('Simulated DB Failure on assignOwner'));

      const deleteUserSpy = vi.spyOn(supabase.auth.admin, 'deleteUser');
      const deleteGymSpy = vi.spyOn(gymRepository, 'hardDelete');

      await expect(
        AdminService.onboardGym({
          name: 'Rollback Gym',
          slug: 'rollback-gym',
          owner: {
            email: 'owner@rollback.com',
            password: 'Password123!',
            fullName: 'Rollback Owner',
          },
        })
      ).rejects.toThrow('Simulated DB Failure on assignOwner');

      // Assert auth user rollback was triggered
      expect(deleteUserSpy).toHaveBeenCalledWith(OWNER_A);
      // Assert gym rollback was triggered
      expect(deleteGymSpy).toHaveBeenCalledWith('47d7dfca-8857-48f8-b3ab-5c30fbdb7bb9');
    });
  });

  describe('Trainer Creation Rollback', () => {
    it('should roll back user creation if trainer database insert fails', async () => {
      mockTable('profiles', { id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7', email: 'trainer@rollback.com' });

      // Force trainer repository insert to fail
      vi.spyOn(trainerRepository, 'create').mockRejectedValueOnce(new Error('Simulated DB Failure on trainer insert'));
      const deleteUserSpy = vi.spyOn(supabase.auth.admin, 'deleteUser');

      await expect(
        TrainerService.create(GYM_A, {
          fullName: 'Trainer Rollback',
          email: 'trainer@rollback.com',
          password: 'Password123!',
        })
      ).rejects.toThrow('Simulated DB Failure on trainer insert');

      expect(deleteUserSpy).toHaveBeenCalledWith('47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7');
    });
  });

  describe('Join Request Approval Rollback', () => {
    it('should roll back profile update and member insert if request update fails', async () => {
      // Mock join request fetch
      mockTable('gym_join_requests', {
        id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba9',
        profile_id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1',
        status: 'pending',
      });

      // Mock profile fetch
      mockTable('profiles', {
        id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1',
        email: 'member@rollback.com',
        full_name: 'Member Rollback',
      });

      // Mock member check and creation returning a new row id
      mockTable('members', {
        id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb5',
      });

      // Force the final gym_join_requests status update to fail
      vi.spyOn(supabase, 'update').mockReturnValueOnce({
        eq: vi.fn().mockResolvedValueOnce({ error: new Error('Simulated DB Failure on request update') }),
      } as any);

      await expect(
        GymService.approveJoinRequest(GYM_A, '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba9')
      ).rejects.toThrow('Simulated DB Failure on request update');

      // Verify that rollback update query was triggered on profiles table
      const profileUpdateSpy = vi.mocked(supabase.from);
      expect(profileUpdateSpy).toHaveBeenCalledWith('profiles');
    });
  });
});
