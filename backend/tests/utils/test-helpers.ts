import { vi } from 'vitest';
import { supabase } from '@/config/supabase';
import { testDbRegistry } from '../setup';
import { Role } from '@/shared/rbac';
import { AccountStatus } from '@/shared/types';

/**
 * Configure what a table query returns.
 */
export function mockTable(table: string, data: any, error: any = null, count: number | null = null) {
  testDbRegistry.mocks[table] = { data, error, count };
}

/**
 * Reset all mock registries and vitest spies.
 */
export function resetMocks() {
  testDbRegistry.reset();
  vi.clearAllMocks();
}

/**
 * Append a mock profile to the registry.
 */
export function addMockProfile(profile: {
  id: string;
  email: string;
  role: Role;
  gym_id: string | null;
  status: AccountStatus;
  gyms?: any;
}) {
  const current = testDbRegistry.mocks['profiles']?.data || [];
  const list = Array.isArray(current) ? [...current] : [current];
  
  // Check if profile with same ID is already registered, remove it
  const filtered = list.filter(p => p.id !== profile.id);
  filtered.push({
    ...profile,
    gyms: profile.gyms || (profile.gym_id ? { status: 'active' } : null)
  });
  
  mockTable('profiles', filtered);
}

/**
 * Sets up mocked user authentication for testing.
 * Causes `authenticate` middleware to succeed and populate `req.user`.
 */
export function setupAuthUser(
  role: Role,
  gymId: string | null = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2',
  userId: string = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba1',
  email: string = 'test@example.com',
  status: AccountStatus = AccountStatus.ACTIVE
) {
  // Mock getUser response
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: {
      user: {
        id: userId,
        email,
      } as any,
    },
    error: null,
  });

  // Mock profile query via the list helper
  addMockProfile({
    id: userId,
    email,
    role,
    gym_id: gymId,
    status,
  });

  // Mock staff grants/permissions if staff/trainer
  if (role === Role.STAFF || role === Role.TRAINER) {
    mockTable('gym_staff', {
      permissions: [],
    });
  }
}
