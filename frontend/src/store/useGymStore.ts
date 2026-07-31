import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface PublicGym {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  description: string | null;
  logoUrl: string | null;
  timings: Record<string, { open: string; close: string }>;
  weeklyOff: string[];
  status: 'active' | 'suspended' | 'pending';
}

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

export interface MyJoinRequest {
  id: string;
  gym_id: string;
  status: JoinRequestStatus;
  created_at: string;
  gyms: { name: string; logo_url: string | null } | null;
}

interface GymState {
  directory: PublicGym[];
  directoryLoading: boolean;
  myRequest: MyJoinRequest | null;
  requestStatusLoading: boolean;
  submitting: boolean;
  fetchDirectory: (search?: string) => Promise<void>;
  fetchMyRequestStatus: () => Promise<void>;
  submitJoinRequest: (gymId: string) => Promise<{ success: boolean; message?: string }>;
  reset: () => void;
}

export const useGymStore = create<GymState>((set, get) => ({
  directory: [],
  directoryLoading: false,
  myRequest: null,
  requestStatusLoading: false,
  submitting: false,

  fetchDirectory: async (search?: string) => {
    try {
      set({ directoryLoading: true });
      const res = await apiClient.get('/gyms/directory', {
        params: search ? { search, limit: 50 } : { limit: 50 },
      });
      if (res.data?.success) {
        set({ directory: res.data.data || [] });
      }
    } catch (err: any) {
      console.warn('Failed to load gym directory:', err);
    } finally {
      set({ directoryLoading: false });
    }
  },

  fetchMyRequestStatus: async () => {
    try {
      set({ requestStatusLoading: true });
      const res = await apiClient.get('/gyms/join-request/status');
      if (res.data?.success) {
        set({ myRequest: res.data.data || null });
      }
    } catch (err: any) {
      console.warn('Failed to load join request status:', err);
    } finally {
      set({ requestStatusLoading: false });
    }
  },

  submitJoinRequest: async (gymId: string) => {
    try {
      set({ submitting: true });
      const res = await apiClient.post('/gyms/join-request', { gymId });
      if (res.data?.success) {
        await get().fetchMyRequestStatus();
        return { success: true };
      }
      return { success: false, message: res.data?.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    } finally {
      set({ submitting: false });
    }
  },

  reset: () => set({ directory: [], myRequest: null }),
}));
