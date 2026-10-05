import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { clearAccountQueries } from '@/api/queryClient';
import { useUIStore } from './ui.store';

export interface RenewableSession { refreshToken: string; expiresAt: number | null }

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  refreshToken: string | null;
  expiresAt: number | null;
  accountGeneration: number;

  setAuth: (user: User, token: string, session: RenewableSession) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      refreshToken: null,
      expiresAt: null,
      accountGeneration: 0,

      setAuth: (user, token, session) => {
        const previous = get().user;
        const changed = previous?.id !== user.id || previous?.gymId !== user.gymId || previous?.role !== user.role;
        if (changed) clearAccountQueries();
        set({ user, token, refreshToken: session.refreshToken, expiresAt: session.expiresAt, isAuthenticated: true,
          accountGeneration: get().accountGeneration + (changed ? 1 : 0) });
      },

      setUser: user => {
        const changed = get().user?.id !== user.id || get().user?.gymId !== user.gymId || get().user?.role !== user.role;
        if (changed) clearAccountQueries();
        set({ user, accountGeneration: get().accountGeneration + (changed ? 1 : 0) });
      },

      logout: () => {
        clearAccountQueries();
        useUIStore.setState({ notificationDrawerOpen: false, mobileMenuOpen: false });
        // Remove older duplicated credentials; never fall back to them.
        for (const key of ['token', 'user']) localStorage.removeItem(key);
        set({ user: null, token: null, refreshToken: null, expiresAt: null, isAuthenticated: false,
          accountGeneration: get().accountGeneration + 1 });
      },
    }),
    {
      name: 'aura-auth',
      version: 1,
      migrate: () => ({ user: null, token: null, refreshToken: null, expiresAt: null, isAuthenticated: false }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<AuthStore> | undefined;
        if (!saved?.user?.id || !saved.token || !saved.refreshToken || !saved.isAuthenticated) return current;
        return { ...current, user: saved.user, token: saved.token, refreshToken: saved.refreshToken,
          expiresAt: saved.expiresAt ?? null, isAuthenticated: true };
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
      }),
    },
  ),
);

export function accountQueryKey(parts: readonly unknown[]): readonly unknown[] {
  const { user, accountGeneration } = useAuthStore.getState();
  return [...parts, { account: user?.id ?? null, gym: user?.gymId ?? null, role: user?.role ?? null, generation: accountGeneration }];
}
