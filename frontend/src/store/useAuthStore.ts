import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../api/supabase';
import { apiClient } from '../api/client';
import { useGymStore } from '../store/useGymStore';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'customer' | 'owner' | 'staff' | 'trainer' | 'super_admin' | null;
  gym_id: string | null;
  status: string | null;
  created_at: string | null;
  onboarding_completed?: boolean | null;
  date_of_birth?: string | null;
  gender?: string | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  fitness_level?: string | null;
  fitness_goal?: string | null;
  training_frequency?: string | null;
  location_address?: string | null;
  gym_preference?: string | null;
  has_health_condition?: boolean | null;
  health_conditions?: string[] | null;
  dietary_preference?: string | null;
}

export interface SubscriptionPlan {
  id?: string;
  name?: string;
  price?: number | string;
  durationDays?: number;
  duration_days?: number;
}

export interface Subscription {
  id: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  plan?: SubscriptionPlan | null;
  plans?: SubscriptionPlan | null;
  endDate?: string | null;
  end_date?: string | null;
  startDate?: string | null;
  start_date?: string | null;
  [key: string]: unknown;
}

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  accessToken: string | null;
  subscription: Subscription | null;
  /** True until the first persisted-session restore completes. */
  initializing: boolean;
  loading: boolean;
  setSession: (session: Session | null) => Promise<void>;
  loadUserProfile: () => Promise<void>;
  loadSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Serializes overlapping auth events (INITIAL_SESSION / SIGNED_IN /
// TOKEN_REFRESHED can fire in quick succession) so profile/subscription
// loads never interleave and clobber each other.
let sessionChain: Promise<void> = Promise.resolve();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  accessToken: null,
  subscription: null,
  initializing: true,
  loading: false,

  setSession: (session) => {
    sessionChain = sessionChain.then(async () => {
      if (session) {
        const sameUser = get().user?.id === session.user?.id;
        set({ user: session.user, accessToken: session.access_token ?? null });

        // A pure token refresh for the same user doesn't need a full
        // profile + subscription reload.
        if (sameUser && get().userProfile) {
          set({ initializing: false });
          return;
        }

        await get().loadUserProfile();

        // If the profile fetch failed (offline, transient error), fall back to
        // a minimal profile derived from the session so the navigator never
        // hangs on the loader. A null role routes to the customer stack.
        if (!get().userProfile) {
          set({
            userProfile: {
              id: session.user.id,
              email: session.user.email ?? null,
              full_name: (session.user.user_metadata?.full_name as string) ?? null,
              phone: null,
              avatar_url: null,
              role: null,
              gym_id: null,
              status: null,
              created_at: null,
            },
          });
        }

        const profile = get().userProfile;
        const isCustomer = !profile?.role || profile.role === 'customer';
        if (isCustomer) {
          await get().loadSubscription();
        }
      } else {
        set({ user: null, userProfile: null, accessToken: null, subscription: null });
      }
      set({ initializing: false });
    });
    return sessionChain;
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
        set({ userProfile: data as UserProfile });
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
        const subs: Subscription[] = Array.isArray(rawData) ? rawData : [rawData].filter(Boolean);
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
    set({ loading: true });
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Even if the network revoke fails, the local session must be cleared —
      // otherwise the user is stuck "logged in" while offline.
      console.warn('Signout error (local session cleared anyway):', error);
    } finally {
      set({
        user: null,
        userProfile: null,
        accessToken: null,
        subscription: null,
        loading: false,
      });
      useGymStore.getState().reset();
    }
  },
}));
