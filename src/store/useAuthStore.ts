import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { apiClient } from '../api/client';

interface AuthState {
  user: any | null;
  accessToken: string | null;
  subscription: any | null;
  loading: boolean;
  setSession: (session: any) => void;
  loadSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  subscription: null,
  loading: false,

  setSession: (session) => {
    if (session) {
      set({
        user: session.user,
        accessToken: session.access_token || session.token || null,
      });
      // Try to load their active subscription status immediately
      get().loadSubscription();
    } else {
      set({ user: null, accessToken: null, subscription: null });
    }
  },

  loadSubscription: async () => {
    if (!get().accessToken) return;
    try {
      set({ loading: true });
      const response = await apiClient.get('/subscriptions/me');
      if (response.data && response.data.success) {
        set({ subscription: response.data.data });
      }
    } catch (error) {
      console.warn('Error loading active subscription status:', error);
      set({ subscription: null });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      await supabase.auth.signOut();
      set({ user: null, accessToken: null, subscription: null });
    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      set({ loading: false });
    }
  },
}));
