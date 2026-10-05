import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppRouter } from '@/routes/AppRouter';
import { queryClient } from '@/api/queryClient';
import { useAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';

export default function App() {
  const generation = useAuthStore(state => state.accountGeneration);
  useEffect(() => {
    const syncOtherTab = (event: StorageEvent) => {
      if (event.key !== 'aura-auth') return;
      const current = useAuthStore.getState();
      try {
        const stored = event.newValue ? JSON.parse(event.newValue).state : null;
        if (!stored?.isAuthenticated || !stored.user?.id || !stored.token || !stored.refreshToken) {
          if (current.isAuthenticated) current.logout();
        } else if (stored.token !== current.token || stored.refreshToken !== current.refreshToken ||
          stored.user.id !== current.user?.id || stored.user.gymId !== current.user?.gymId || stored.user.role !== current.user?.role) {
          current.setAuth(stored.user, stored.token, { refreshToken: stored.refreshToken, expiresAt: stored.expiresAt ?? null });
        }
      } catch { if (current.isAuthenticated) current.logout(); }
    };
    window.addEventListener('storage', syncOtherTab);
    return () => window.removeEventListener('storage', syncOtherTab);
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter key={generation}>
        <AppRouter />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1B1D22',
              border: '1px solid #2A2D35',
              color: '#FFFFFF',
              fontSize: '14px',
            },
          }}
          richColors
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
