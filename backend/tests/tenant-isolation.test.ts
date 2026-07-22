import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { mockTable, resetMocks, setupAuthUser, addMockProfile } from './utils/test-helpers';
import { Role } from '@/shared/rbac';
import { AccountStatus } from '@/shared/types';
import { supabase } from '@/config/supabase';

const app = createApp();

describe('Tenant Isolation Auditing', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should scope plans fetch strictly to the user\'s gym_id context', async () => {
    setupAuthUser(Role.OWNER, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006');

    mockTable('plans', [
      { id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba1', gym_id: '00000000-0000-0000-0000-000000000002', name: 'Elite Plan' }
    ]);

    const res = await request(app)
      .get('/api/v1/plans')
      .set('Authorization', 'Bearer 00000000-0000-0000-0000-000000000006');

    expect(res.status).toBe(200);
    // Verify the query to Supabase table 'plans' was indeed scoped with eq('gym_id', '00000000-0000-0000-0000-000000000002')
    const selectSpy = vi.mocked(supabase.from);
    expect(selectSpy).toHaveBeenCalledWith('plans');
    expect(vi.mocked(supabase.eq)).toHaveBeenCalledWith('gym_id', '00000000-0000-0000-0000-000000000002');
  });

  it('should scope members directory search to owner\'s gym_id context', async () => {
    setupAuthUser(Role.OWNER, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006');

    addMockProfile({
      id: '00000000-0000-0000-0000-000000000012',
      email: 'member@example.com',
      role: Role.CUSTOMER,
      gym_id: '00000000-0000-0000-0000-000000000002',
      status: AccountStatus.ACTIVE,
    });

    const res = await request(app)
      .get('/api/v1/members')
      .set('Authorization', 'Bearer 00000000-0000-0000-0000-000000000006');

    expect(res.status).toBe(200);
    // Verifies profiles query contains filter for current gym
    expect(vi.mocked(supabase.from)).toHaveBeenCalledWith('profiles');
    expect(vi.mocked(supabase.eq)).toHaveBeenCalledWith('gym_id', '00000000-0000-0000-0000-000000000002');
  });

  it('should reject requests where user is not associated to any gym (requireGym)', async () => {
    setupAuthUser(Role.OWNER, null, '00000000-0000-0000-0000-000000000013'); // Gym id is null

    const res = await request(app)
      .get('/api/v1/plans')
      .set('Authorization', 'Bearer 00000000-0000-0000-0000-000000000013');

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('NO_GYM_CONTEXT');
  });
});
