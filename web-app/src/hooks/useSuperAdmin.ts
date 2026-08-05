import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Gym } from '@/types';

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
  setGyms: (gyms: GymWithOwner[]) => void;
  setOwners: (owners: GymOwner[]) => void;
}

export const useSuperAdmin = create<SuperAdminState>()(
  persist(
    (set) => ({
      gyms: [],
      owners: [],

      setGyms: (gyms) => set({ gyms }),
      setOwners: (owners) => set({ owners }),

      addGym: (gymData) =>
        set((state) => {
          const newId = `gym-${state.gyms.length + 1}`;
          const newGym: GymWithOwner = {
            ...gymData,
            id: newId,
            createdAt: new Date().toISOString().split('T')[0],
          };

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
              : gym,
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
            owner.id === id ? { ...owner, status } : owner,
          ),
        })),
    }),
    {
      name: 'aura-apex-superadmin-store',
    },
  ),
);
