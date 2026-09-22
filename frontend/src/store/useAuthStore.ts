import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  setSession: (session: any, profileData?: any) => Promise<void>;
  loadUserProfile: () => Promise<void>;
  completeOnboarding: (data: Partial<UserProfile>) => Promise<void>;
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

  setSession: (session: any, profileData?: any) => {
    sessionChain = sessionChain.then(async () => {
      if (session) {
        const token = session.access_token ?? session.accessToken ?? null;
        const userId = session.user?.id ?? profileData?.id ?? session.id ?? null;

        const userObj: any = session.user ?? (userId ? {
          id: userId,
          email: session.user?.email ?? profileData?.email ?? null,
          user_metadata: { full_name: profileData?.fullName ?? profileData?.full_name ?? null }
        } : null);

        const sameUser = userId && get().user?.id === userId;
        set({ user: userObj, accessToken: token });

        if (sameUser && get().userProfile) {
          set({ initializing: false });
          return;
        }

        if (profileData) {
          set({
            userProfile: {
              id: profileData.id,
              email: profileData.email ?? null,
              full_name: profileData.fullName ?? profileData.full_name ?? null,
              phone: profileData.phone ?? null,
              avatar_url: profileData.avatarUrl ?? profileData.avatar_url ?? null,
              role: profileData.role ?? null,
              gym_id: profileData.gymId ?? profileData.gym_id ?? null,
              status: profileData.status ?? null,
              created_at: profileData.createdAt ?? profileData.created_at ?? null,
              onboarding_completed: profileData.onboardingCompleted ?? profileData.onboarding_completed ?? true,
            },
          });
        } else {
          await get().loadUserProfile();
        }

        if (!get().userProfile && userId) {
          set({
            userProfile: {
              id: userId,
              email: userObj?.email ?? null,
              full_name: (userObj?.user_metadata?.full_name as string) ?? null,
              phone: null,
              avatar_url: null,
              role: null,
              gym_id: null,
              status: null,
              created_at: null,
              onboarding_completed: true,
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
        .maybeSingle();

      if (!error && data) {
        // Existing registered user: onboarding_completed is true -> goes straight to Home screen
        set({
          userProfile: {
            ...data,
            onboarding_completed: data.onboarding_completed ?? true,
          } as UserProfile,
        });
      } else {
        // Auto-initialize profile for new Google Sign-In or newly registered user
        const initialProfile: UserProfile = {
          id: user.id,
          email: user.email ?? null,
          full_name: (user.user_metadata?.full_name as string) ?? (user.user_metadata?.name as string) ?? null,
          phone: user.phone ?? null,
          avatar_url: (user.user_metadata?.avatar_url as string) ?? (user.user_metadata?.picture as string) ?? null,
          role: 'customer',
          gym_id: null,
          status: 'active',
          created_at: new Date().toISOString(),
          onboarding_completed: false,
        };

        try {
          const { data: createdProfile } = await supabase
            .from('profiles')
            .upsert(initialProfile)
            .select('*')
            .single();

          if (createdProfile) {
            set({ userProfile: createdProfile as UserProfile });
          } else {
            set({ userProfile: initialProfile });
          }
        } catch {
          set({ userProfile: initialProfile });
        }
      }
    } catch (err) {
      console.warn('Failed to load or initialize user profile:', err);
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

  completeOnboarding: async (data: Partial<UserProfile>) => {
    const user = get().user;
    const currentProfile = get().userProfile;

    const updatedProfile: UserProfile = {
      ...(currentProfile || {}),
      ...data,
      id: user?.id || currentProfile?.id || '',
      email: user?.email || currentProfile?.email || null,
      onboarding_completed: true,
    } as UserProfile;

    // Immediately set userProfile in Zustand so AppNavigator re-renders and switches stack instantly
    set({ userProfile: updatedProfile });

    if (user?.id) {
      (async () => {
        try {
          await supabase.from('profiles').upsert(updatedProfile);
        } catch (err) {
          console.warn('Background profile save error:', err);
        }
      })();
    }
  },

  signOut: async () => {
    // Clear local state immediately for a snappy UI transition
    set({
      user: null,
      userProfile: null,
      accessToken: null,
      subscription: null,
      loading: false,
    });
    useGymStore.getState().reset();

    try {
      await AsyncStorage.setItem('has_seen_onboarding', 'true');
    } catch {
      // ignore
    }

    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Even if the network revoke fails, the local session is cleared
      console.warn('Signout error (local session cleared anyway):', error);
    }
  },
}));
