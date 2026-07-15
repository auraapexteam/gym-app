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
      // Load user profile first to determine role
      await get().loadUserProfile();

      // Only load subscription for CUSTOMER role with a linked gym
      const profile = get().userProfile;
      const isCustomer = profile?.role === 'customer' || !profile?.role;
      const hasGym = !!profile?.gym_id;
      if (isCustomer && hasGym) {
        await get().loadSubscription();
      }
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
    } catch (error: any) {
      // 404 = no active subscription, that's normal for new customers
      if (error?.response?.status !== 404) {
        console.warn('Error loading subscription:', error?.response?.data?.message || error.message);
      }
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
