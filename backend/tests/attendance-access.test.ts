import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { Permission, Role } from '@/shared/rbac';
import { mockTable, resetMocks, setupAuthUser } from './utils/test-helpers';
import { AttendanceService } from '@/modules/attendance/attendance.service';
import { attendanceRepository } from '@/modules/attendance/attendance.repository';
import { MemberService } from '@/modules/members';
import { SubscriptionService } from '@/modules/subscriptions';

const app = createApp();
const gymId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2';
const otherGymId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba4';
const userId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba3';
const ownMemberId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1';
const otherMemberId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb2';

describe('Attendance ownership and tenant access', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetMocks();
  });

  it.each(['/', '/stats'])('denies customer gym-wide reads at %s before loading attendance', async (path) => {
    setupAuthUser(Role.CUSTOMER, gymId, userId);
    const list = vi.spyOn(AttendanceService, 'listForGym');
    const stats = vi.spyOn(AttendanceService, 'stats');
    const res = await request(app).get(`/api/v1/attendance${path}`)
      .set('Authorization', `Bearer ${userId}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ROLE_FORBIDDEN');
    expect(list).not.toHaveBeenCalled();
    expect(stats).not.toHaveBeenCalled();
  });

  it('denies a customer manual check-in for another member', async () => {
    setupAuthUser(Role.CUSTOMER, gymId, userId);
    const write = vi.spyOn(AttendanceService, 'manualCheckIn');
    const res = await request(app).post('/api/v1/attendance/manual')
      .set('Authorization', `Bearer ${userId}`).send({ memberId: otherMemberId });
    expect(res.status).toBe(403);
    expect(write).not.toHaveBeenCalled();
  });

  it('requires the manual check-in permission even for a gym trainer', async () => {
    setupAuthUser(Role.TRAINER, gymId, userId);
    const res = await request(app).post('/api/v1/attendance/manual')
      .set('Authorization', `Bearer ${userId}`).send({ memberId: ownMemberId });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PERMISSION_DENIED');
  });

  it('honors a staff permission grant while retaining the trusted gym context', async () => {
    setupAuthUser(Role.TRAINER, gymId, userId);
    mockTable('gym_staff', { permissions: [Permission.ATTENDANCE_CREATE] });
    const write = vi.spyOn(AttendanceService, 'manualCheckIn').mockResolvedValue({ id: 'attendance-test' } as any);
    const res = await request(app).post('/api/v1/attendance/manual')
      .set('Authorization', `Bearer ${userId}`)
      .send({ memberId: ownMemberId, gymId: otherGymId });
    expect(res.status).toBe(201);
    expect(write).toHaveBeenCalledWith(gymId, ownMemberId);
  });

  it('rejects a staff manual check-in for a member of a different gym', async () => {
    setupAuthUser(Role.STAFF, gymId, userId);
    mockTable('members', { id: otherMemberId, gym_id: otherGymId, profile_id: 'other-profile' });
    const activeMembership = vi.spyOn(SubscriptionService, 'hasActiveMembership');
    const create = vi.spyOn(attendanceRepository, 'create');
    const res = await request(app).post('/api/v1/attendance/manual')
      .set('Authorization', `Bearer ${userId}`).send({ memberId: otherMemberId });
    expect(res.status).toBe(404);
    expect(activeMembership).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it.each([Role.OWNER, Role.STAFF, Role.TRAINER])('keeps %s reads inside their gym despite a supplied gymId', async (role) => {
    setupAuthUser(role, gymId, userId);
    mockTable('attendances', [
      { id: 'own-gym', gym_id: gymId, member_id: ownMemberId },
      { id: 'different-gym', gym_id: otherGymId, member_id: otherMemberId },
    ]);
    const res = await request(app).get(`/api/v1/attendance?gymId=${otherGymId}`)
      .set('Authorization', `Bearer ${userId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.map((entry: any) => entry.id)).toEqual(['own-gym']);
  });

  it('requires a gym context for staff reads', async () => {
    setupAuthUser(Role.STAFF, null, userId);
    const res = await request(app).get('/api/v1/attendance')
      .set('Authorization', `Bearer ${userId}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('NO_GYM_CONTEXT');
  });

  it('derives /me ownership from authentication even when another profile is supplied', async () => {
    setupAuthUser(Role.CUSTOMER, gymId, userId);
    const members = vi.spyOn(MemberService, 'listMemberIdsForProfile').mockResolvedValue([ownMemberId]);
    const history = vi.spyOn(attendanceRepository, 'findByMemberIds').mockImplementation(async (memberIds) => [
      { id: 'own', member_id: ownMemberId, gym_id: gymId },
      { id: 'other', member_id: otherMemberId, gym_id: gymId },
    ].filter((row) => memberIds.includes(row.member_id)) as any);
    const res = await request(app).get(`/api/v1/attendance/me?profileId=${otherMemberId}&memberId=${otherMemberId}`)
      .set('Authorization', `Bearer ${userId}`);
    expect(res.status).toBe(200);
    expect(members).toHaveBeenCalledWith(userId);
    expect(history).toHaveBeenCalledWith([ownMemberId]);
    expect(res.body.data.map((entry: any) => entry.id)).toEqual(['own']);
  });
});
