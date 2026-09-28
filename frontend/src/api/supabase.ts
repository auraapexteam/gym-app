import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'your_supabase_anon_key_here') {
  console.warn('Warning: Please provide a valid SUPABASE_ANON_KEY in src/config.ts');
}

// Initialize Supabase client
// Keep the SDK's existing default key explicit so deletion can clear only auth data.
export const AUTH_STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    storageKey: AUTH_STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function clearDeletedAccountSession(): Promise<void> {
  await supabase.auth.stopAutoRefresh();
  // Clear persisted credentials first, even if the deleted user's revoke request
  // would fail or the device loses its connection after the DELETE succeeds.
  await Promise.all([
    AUTH_STORAGE_KEY,
    `${AUTH_STORAGE_KEY}-code-verifier`,
    `${AUTH_STORAGE_KEY}-user`,
  ].map(key => AsyncStorage.removeItem(key)));
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
  await supabase.auth.startAutoRefresh();
}
