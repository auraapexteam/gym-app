import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { apiClient } from '../api/client';

interface AuthState {
  user: any | null;
  userProfile: any | null;
  accessToken: string | null;
  subscription: any | null;
  loading: boolean;
  setSession: (session: any) => void;
  loadUserProfile: () => Promise<void>;
  loadSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  accessToken: null,
  subscription: null,
  loading: false,

  setSession: async (session) => {
    if (session) {
      set({
        user: session.user,
        accessToken: session.access_token || session.token || null,
      });
      // Load their profile and subscription status
      await get().loadUserProfile();
      await get().loadSubscription();
    } else {
      set({ user: null, userProfile: null, accessToken: null, subscription: null });
    }
  },

  loadUserProfile: async () => {
    const user = get().user;
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        set({ userProfile: data });
      }
    } catch (err) {
      console.warn('Failed to load user profile:', err);
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
      set({ user: null, userProfile: null, accessToken: null, subscription: null });
    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      set({ loading: false });
    }
  },
}));
