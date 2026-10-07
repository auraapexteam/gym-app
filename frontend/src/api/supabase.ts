import { createClient } from '@supabase/supabase-js';
import { createSecureAuthStorage } from './secureAuthStorage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'your_supabase_anon_key_here') {
  console.warn('Warning: Please provide a valid SUPABASE_ANON_KEY in src/config.ts');
}

// Initialize Supabase client
// Keep the SDK's existing default key explicit so deletion can clear only auth data.
export const AUTH_STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
export const secureAuthStorage = createSecureAuthStorage(AUTH_STORAGE_KEY);
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureAuthStorage,
    storageKey: AUTH_STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function installBackendSession(session: {
  accessToken: string;
  refreshToken: string;
}): Promise<import('@supabase/supabase-js').Session> {
  if (!session.accessToken || !session.refreshToken) {
    throw new Error('Sign-in did not return a renewable session. Please try again.');
  }
  const { data, error } = await supabase.auth.setSession({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
  });
  if (error || !data.session) throw error || new Error('Sign-in could not be completed.');
  return data.session;
}

export async function clearDeletedAccountSession(): Promise<void> {
  await supabase.auth.stopAutoRefresh();
  // Attempt SDK revocation, then always clear encrypted and legacy credentials,
  // including when the revoke request fails after a confirmed account deletion.
  try {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
  } finally {
    // Always erase disk credentials, including when local SDK cleanup fails.
    const cleanup = await Promise.allSettled([
      AUTH_STORAGE_KEY,
      `${AUTH_STORAGE_KEY}-code-verifier`,
      `${AUTH_STORAGE_KEY}-user`,
    ].map(key => secureAuthStorage.removeItem(key)));
    await supabase.auth.startAutoRefresh();
    if (cleanup.some(result => result.status === 'rejected')) throw new Error('Saved credentials could not be fully cleared.');
  }
}
