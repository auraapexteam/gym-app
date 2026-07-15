import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { mockTable, resetMocks, setupAuthUser, addMockProfile } from './utils/test-helpers';
import { Role } from '@/shared/rbac';
import { AccountStatus } from '@/shared/types';
import { attendanceRepository } from '@/modules/attendance/attendance.repository';

const app = createApp();

const GYM_A  = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2';
const STAFF_A = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba8';
const MEMBER_ID = '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb1';

describe('Attendance Unique Constraint / Concurrency Hardening', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should return HTTP 409 Conflict when unique daily check-in constraint is violated at DB level', async () => {
    setupAuthUser(Role.STAFF, GYM_A, STAFF_A);

    addMockProfile({
      id: STAFF_A,
      email: 'staff@aura-apex.com',
      role: Role.STAFF,
      gym_id: GYM_A,
      status: AccountStatus.ACTIVE,
    });

    // Member exists in this gym
    mockTable('members', {
      id: MEMBER_ID,
      gym_id: GYM_A,
      profile_id: STAFF_A,
      status: AccountStatus.ACTIVE,
    });

    // Active subscription exists
    mockTable('subscriptions', [
      {
        id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb3',
        gym_id: GYM_A,
        member_id: MEMBER_ID,
        status: 'active',
        end_date: new Date(Date.now() + 86400000).toISOString(),
      }
    ]);

    // No application-level duplicate detected (both concurrent requests pass this check)
    mockTable('attendances', null); // findByMemberAndDate returns null (not yet checked in)

    // But at the DB-level insert, the unique constraint fires — simulate this via repository spy
    const { ConflictError } = await import('@/shared/errors');
    vi.spyOn(attendanceRepository, 'create').mockRejectedValueOnce(
      new ConflictError('Already checked in today', 'ALREADY_CHECKED_IN')
    );

    const res = await request(app)
      .post('/api/v1/attendance/manual')
      .set('Authorization', `Bearer ${STAFF_A}`)
      .send({ memberId: MEMBER_ID });

    // Expect HTTP 409 Conflict
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_CHECKED_IN');
  });

  it('should return HTTP 409 at app level when findByMemberAndDate detects existing check-in', async () => {
    setupAuthUser(Role.STAFF, GYM_A, STAFF_A);

    addMockProfile({
      id: STAFF_A,
      email: 'staff@aura-apex.com',
      role: Role.STAFF,
      gym_id: GYM_A,
      status: AccountStatus.ACTIVE,
    });

    mockTable('members', {
      id: MEMBER_ID,
      gym_id: GYM_A,
      profile_id: STAFF_A,
      status: AccountStatus.ACTIVE,
    });

    mockTable('subscriptions', [
      {
        id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bb3',
        gym_id: GYM_A,
        member_id: MEMBER_ID,
        status: 'active',
        end_date: new Date(Date.now() + 86400000).toISOString(),
      }
    ]);

    // Application-level duplicate check finds an existing check-in today
    mockTable('attendances', {
      id: '47d7dfca-8857-48f8-b3ab-5c30fbdb7bc1',
      gym_id: GYM_A,
      member_id: MEMBER_ID,
      attendance_date: new Date().toISOString().slice(0, 10),
    });

    const res = await request(app)
      .post('/api/v1/attendance/manual')
      .set('Authorization', `Bearer ${STAFF_A}`)
      .send({ memberId: MEMBER_ID });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_CHECKED_IN');
  });
});
