import type { User, UserRole } from '@/types';

interface MockCredential {
  email: string;
  password: string;
  user: User;
  token: string;
}

const MOCK_USERS: MockCredential[] = [
  {
    email: 'superadmin@auraaapex.com',
    password: 'Demo@123',
    token: 'mock-token-super-admin',
    user: {
      id: 'u1',
      email: 'superadmin@auraaapex.com',
      name: 'Aryan Kapoor',
      role: 'super_admin' as UserRole,
      phone: '9876543210',
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-07-15',
    },
  },
  {
    email: 'owner@auraaapex.com',
    password: 'Demo@123',
    token: 'mock-token-gym-owner',
    user: {
      id: 'u2',
      email: 'owner@auraaapex.com',
      name: 'Rohan Mehta',
      role: 'gym_owner' as UserRole,
      phone: '9765432109',
      gymId: 'g1',
      gymName: 'Aura Apex Fitness — Koramangala',
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-07-15',
    },
  },
  {
    email: 'staff@auraaapex.com',
    password: 'Demo@123',
    token: 'mock-token-staff',
    user: {
      id: 'u3',
      email: 'staff@auraaapex.com',
      name: 'Divya Sharma',
      role: 'staff' as UserRole,
      phone: '9654321098',
      gymId: 'g1',
      gymName: 'Aura Apex Fitness — Koramangala',
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-07-15',
    },
  },
  {
    email: 'trainer@auraaapex.com',
    password: 'Demo@123',
    token: 'mock-token-trainer',
    user: {
      id: 'u4',
      email: 'trainer@auraaapex.com',
      name: 'Raj Kumar',
      role: 'trainer' as UserRole,
      phone: '9543210987',
      gymId: 'g1',
      gymName: 'Aura Apex Fitness — Koramangala',
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-07-15',
    },
  },
  {
    email: 'customer@auraaapex.com',
    password: 'Demo@123',
    token: 'mock-token-customer',
    user: {
      id: 'u5',
      email: 'customer@auraaapex.com',
      name: 'Priya Patel',
      role: 'customer' as UserRole,
      phone: '9432109876',
      gymId: 'g1',
      gymName: 'Aura Apex Fitness — Koramangala',
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-07-15',
    },
  },
];

export function mockLogin(email: string, password: string): { user: User; token: string } {
  const match = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!match) {
    throw new Error('Invalid credentials. Please use the demo credentials below.');
  }
  return { user: match.user, token: match.token };
}
