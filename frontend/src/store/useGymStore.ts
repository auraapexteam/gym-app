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
  directoryError: string | null;
  savedGyms: PublicGym[];
  savedGymIds: string[];
  savedLoading: boolean;
  myRequest: MyJoinRequest | null;
  requestStatusLoading: boolean;
  submitting: boolean;
  fetchDirectory: (search?: string) => Promise<void>;
  fetchSavedGyms: () => Promise<void>;
  toggleBookmarkGym: (gymId: string) => Promise<{ success: boolean; isBookmarked?: boolean; message?: string }>;
  fetchMyRequestStatus: () => Promise<void>;
  submitJoinRequest: (gymId: string) => Promise<{ success: boolean; message?: string }>;
  reset: () => void;
}

// Monotonic id so a slow, older directory response can never overwrite the
// results of a newer search (type-ahead race).
let directoryRequestId = 0;

export const useGymStore = create<GymState>((set, get) => ({
  directory: [],
  directoryLoading: false,
  directoryError: null,
  savedGyms: [],
  savedGymIds: [],
  savedLoading: false,
  myRequest: null,
  requestStatusLoading: false,
  submitting: false,

  fetchDirectory: async (search?: string) => {
    const requestId = ++directoryRequestId;
    try {
      set({ directoryLoading: true, directoryError: null });
      const res = await apiClient.get('/gyms/directory', {
        params: search ? { search, limit: 50 } : { limit: 50 },
      });
      if (requestId !== directoryRequestId) return; // stale response
      if (res.data?.success) {
        const raw = res.data.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray(res.data)
          ? res.data
          : [];
        set({ directory: list });
      }
    } catch (err: any) {
      if (requestId !== directoryRequestId) return;
      set({ directoryError: err?.message || 'Failed to load gyms.' });
    } finally {
      if (requestId === directoryRequestId) {
        set({ directoryLoading: false });
      }
    }
  },

  fetchSavedGyms: async () => {
    try {
      set({ savedLoading: true });
      const res = await apiClient.get('/gyms/saved');
      if (res.data?.success) {
        const gyms = res.data.data || [];
        set({
          savedGyms: gyms,
          savedGymIds: gyms.map((g: any) => g.id),
        });
      }
    } catch (err: any) {
      console.warn('Failed to load saved gyms:', err);
    } finally {
      set({ savedLoading: false });
    }
  },

  toggleBookmarkGym: async (gymId: string) => {
    try {
      const res = await apiClient.post(`/gyms/${gymId}/bookmark`);
      if (res.data?.success) {
        const isBookmarked = res.data.data?.isBookmarked ?? res.data.isBookmarked;
        set((state) => {
          const exists = state.savedGymIds.includes(gymId);
          const nextIds = exists
            ? state.savedGymIds.filter((id) => id !== gymId)
            : [...state.savedGymIds, gymId];
          return { savedGymIds: nextIds };
        });
        get().fetchSavedGyms();
        return { success: true, isBookmarked };
      }
      return { success: false, message: res.data?.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
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

  reset: () =>
    set({
      directory: [],
      directoryLoading: false,
      directoryError: null,
      savedGyms: [],
      savedGymIds: [],
      savedLoading: false,
      myRequest: null,
      requestStatusLoading: false,
      submitting: false,
    }),
}));
