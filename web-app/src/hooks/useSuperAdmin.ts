import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Gym, UserRole } from '@/types';

export interface GymWithOwner extends Gym {
  lat: number;
  lng: number;
  status: 'active' | 'expired' | 'suspended' | 'pending';
}

export interface GymOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
  gyms: string[]; // Gym IDs
  status: 'active' | 'suspended';
  createdAt: string;
}

interface SuperAdminState {
  gyms: GymWithOwner[];
  owners: GymOwner[];
  addGym: (gym: Omit<GymWithOwner, 'id' | 'createdAt'>) => void;
  updateGymStatus: (id: string, status: GymWithOwner['status']) => void;
  deleteGym: (id: string) => void;
  addOwner: (owner: Omit<GymOwner, 'id' | 'createdAt' | 'gyms'>) => void;
  updateOwnerStatus: (id: string, status: GymOwner['status']) => void;
}

const INITIAL_GYMS: GymWithOwner[] = [
  {
    id: 'gym-1',
    name: 'Aura Apex Fitness — Koramangala',
    address: '80 Feet Rd, Koramangala 4th Block, Bengaluru, Karnataka 560034',
    phone: '9876543211',
    email: 'koramangala@auraapex.com',
    ownerId: 'owner-1',
    ownerName: 'Rohan Mehta',
    totalMembers: 450,
    activeMembers: 380,
    monthlyRevenue: 285000,
    isActive: true,
    createdAt: '2024-01-15',
    lat: 12.9352,
    lng: 77.6245,
    status: 'active',
  },
  {
    id: 'gym-2',
    name: 'Aura Apex Fitness — Indiranagar',
    address: '100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038',
    phone: '9876543212',
    email: 'indiranagar@auraapex.com',
    ownerId: 'owner-2',
    ownerName: 'Vikram Sen',
    totalMembers: 380,
    activeMembers: 320,
    monthlyRevenue: 240000,
    isActive: true,
    createdAt: '2024-02-10',
    lat: 12.9719,
    lng: 77.6412,
    status: 'active',
  },
  {
    id: 'gym-3',
    name: 'Aura Apex Fitness — HSR Layout',
    address: '19th Main Rd, Sector 3, HSR Layout, Bengaluru, Karnataka 560102',
    phone: '9876543213',
    email: 'hsr@auraapex.com',
    ownerId: 'owner-1',
    ownerName: 'Rohan Mehta',
    totalMembers: 520,
    activeMembers: 460,
    monthlyRevenue: 345000,
    isActive: true,
    createdAt: '2024-03-01',
    lat: 12.9101,
    lng: 77.6450,
    status: 'active',
  },
  {
    id: 'gym-4',
    name: 'Aura Apex Fitness — Whitefield',
    address: 'ITPL Main Rd, Brookefield, Bengaluru, Karnataka 560066',
    phone: '9876543214',
    email: 'whitefield@auraapex.com',
    ownerId: 'owner-3',
    ownerName: 'Neha Reddy',
    totalMembers: 310,
    activeMembers: 270,
    monthlyRevenue: 195000,
    isActive: true,
    createdAt: '2024-04-20',
    lat: 12.9698,
    lng: 77.7499,
    status: 'active',
  },
  {
    id: 'gym-5',
    name: 'Aura Apex Fitness — Jayanagar',
    address: '9th Main Rd, 4th Block, Jayanagar, Bengaluru, Karnataka 560011',
    phone: '9876543215',
    email: 'jayanagar@auraapex.com',
    ownerId: 'owner-4',
    ownerName: 'Anil Kumble',
    totalMembers: 280,
    activeMembers: 240,
    monthlyRevenue: 180000,
    isActive: true,
    createdAt: '2024-05-15',
    lat: 12.9308,
    lng: 77.5830,
    status: 'active',
  },
  {
    id: 'gym-6',
    name: 'Aura Apex Fitness — Malleshwaram',
    address: 'Margosa Rd, Malleshwaram, Bengaluru, Karnataka 560003',
    phone: '9876543216',
    email: 'malleswaram@auraapex.com',
    ownerId: 'owner-5',
    ownerName: 'Preeti Deshmukh',
    totalMembers: 190,
    activeMembers: 120,
    monthlyRevenue: 95000,
    isActive: false,
    createdAt: '2024-06-05',
    lat: 12.9982,
    lng: 77.5703,
    status: 'suspended',
  },
  {
    id: 'gym-7',
    name: 'Aura Apex Fitness — Electronic City',
    address: 'Phase 1, Electronic City, Bengaluru, Karnataka 560100',
    phone: '9876543217',
    email: 'ecity@auraapex.com',
    ownerId: 'owner-6',
    ownerName: 'Sanjay Dutt',
    totalMembers: 150,
    activeMembers: 80,
    monthlyRevenue: 60000,
    isActive: false,
    createdAt: '2024-01-20',
    lat: 12.8452,
    lng: 77.6633,
    status: 'expired',
  },
  {
    id: 'gym-8',
    name: 'Aura Apex Fitness — Yelahanka',
    address: 'Doddaballapur Rd, Yelahanka, Bengaluru, Karnataka 560064',
    phone: '9876543218',
    email: 'yelahanka@auraapex.com',
    ownerId: 'owner-7',
    ownerName: 'Karan Johar',
    totalMembers: 0,
    activeMembers: 0,
    monthlyRevenue: 0,
    isActive: false,
    createdAt: '2024-07-10',
    lat: 13.1008,
    lng: 77.5963,
    status: 'pending',
  },
];

const INITIAL_OWNERS: GymOwner[] = [
  {
    id: 'owner-1',
    name: 'Rohan Mehta',
    email: 'rohan.mehta@gmail.com',
    phone: '9876543201',
    gyms: ['gym-1', 'gym-3'],
    status: 'active',
    createdAt: '2024-01-10',
  },
  {
    id: 'owner-2',
    name: 'Vikram Sen',
    email: 'vikram.sen@outlook.com',
    phone: '9876543202',
    gyms: ['gym-2'],
    status: 'active',
    createdAt: '2024-02-05',
  },
  {
    id: 'owner-3',
    name: 'Neha Reddy',
    email: 'neha.reddy@yahoo.com',
    phone: '9876543203',
    gyms: ['gym-4'],
    status: 'active',
    createdAt: '2024-04-15',
  },
  {
    id: 'owner-4',
    name: 'Anil Kumble',
    email: 'anil.kumble@kumble.com',
    phone: '9876543204',
    gyms: ['gym-5'],
    status: 'active',
    createdAt: '2024-05-10',
  },
  {
    id: 'owner-5',
    name: 'Preeti Deshmukh',
    email: 'preeti.desh@gmail.com',
    phone: '9876543205',
    gyms: ['gym-6'],
    status: 'active',
    createdAt: '2024-06-01',
  },
  {
    id: 'owner-6',
    name: 'Sanjay Dutt',
    email: 'sanjay.dutt@gmail.com',
    phone: '9876543206',
    gyms: ['gym-7'],
    status: 'suspended',
    createdAt: '2024-01-18',
  },
  {
    id: 'owner-7',
    name: 'Karan Johar',
    email: 'karan.johar@dharmaprod.com',
    phone: '9876543207',
    gyms: ['gym-8'],
    status: 'active',
    createdAt: '2024-07-08',
  },
];

export const useSuperAdmin = create<SuperAdminState>()(
  persist(
    (set) => ({
      gyms: INITIAL_GYMS,
      owners: INITIAL_OWNERS,

      addGym: (gymData) =>
        set((state) => {
          const newId = `gym-${state.gyms.length + 1}`;
          const newGym: GymWithOwner = {
            ...gymData,
            id: newId,
            createdAt: new Date().toISOString().split('T')[0],
          };

          // Also link this gym to the owner
          const updatedOwners = state.owners.map((owner) => {
            if (owner.id === gymData.ownerId) {
              return {
                ...owner,
                gyms: [...owner.gyms, newId],
              };
            }
            return owner;
          });

          return {
            gyms: [...state.gyms, newGym],
            owners: updatedOwners,
          };
        }),

      updateGymStatus: (id, status) =>
        set((state) => ({
          gyms: state.gyms.map((gym) =>
            gym.id === id
              ? {
                  ...gym,
                  status,
                  isActive: status === 'active',
                }
              : gym
          ),
        })),

      deleteGym: (id) =>
        set((state) => ({
          gyms: state.gyms.filter((gym) => gym.id !== id),
          owners: state.owners.map((owner) => ({
            ...owner,
            gyms: owner.gyms.filter((gymId) => gymId !== id),
          })),
        })),

      addOwner: (ownerData) =>
        set((state) => {
          const newId = `owner-${state.owners.length + 1}`;
          const newOwner: GymOwner = {
            ...ownerData,
            id: newId,
            gyms: [],
            createdAt: new Date().toISOString().split('T')[0],
          };
          return {
            owners: [...state.owners, newOwner],
          };
        }),

      updateOwnerStatus: (id, status) =>
        set((state) => ({
          owners: state.owners.map((owner) =>
            owner.id === id ? { ...owner, status } : owner
          ),
        })),
    }),
    {
      name: 'aura-apex-superadmin-store',
    }
  )
);
