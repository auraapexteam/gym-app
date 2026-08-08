import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { apiClient } from '../api/client';
import { useGymStore } from '../store/useGymStore';

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

      // Always load subscription — loadSubscription handles the no-gym case gracefully
      // and will refresh userProfile if an active sub is found without a gym_id in profile.
      const profile = get().userProfile;
      const isCustomer = !profile?.role || profile.role === 'customer';
      if (isCustomer) {
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
        const rawData = response.data.data;
        // /subscriptions/me returns either an array or a single object
        const subs: any[] = Array.isArray(rawData) ? rawData : [rawData].filter(Boolean);
        // Pick the most recent active subscription; fall back to the most recent one
        const activeSub = subs.find((s) => s.status === 'active') ?? subs[0] ?? null;
        set({ subscription: activeSub });

        // If a subscription is active and userProfile.gym_id is not yet set in memory, refresh the profile so
        // gymStatus recomputes to 'linked' and the HomeScreen shows the active plan card immediately.
        if (activeSub?.status === 'active' && !get().userProfile?.gym_id) {
          await get().loadUserProfile();
        }
      }
    } catch (error: any) {
      // 404 = no active subscription — normal for new customers
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
      useGymStore.getState().reset();
    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      set({ loading: false });
    }
  },
}));
