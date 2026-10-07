import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_STORAGE_KEY, clearDeletedAccountSession, installBackendSession, supabase } from '../src/api/supabase';

jest.mock('../src/config', () => ({ SUPABASE_URL: 'https://test-project.supabase.co', SUPABASE_ANON_KEY: 'test-public-key' }));
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ auth: {
    stopAutoRefresh: jest.fn().mockResolvedValue(undefined),
    startAutoRefresh: jest.fn().mockResolvedValue(undefined),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    setSession: jest.fn(),
  } })),
}));

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, 'test-session');
  await AsyncStorage.setItem(`${AUTH_STORAGE_KEY}-code-verifier`, 'test-verifier');
  await AsyncStorage.setItem(`${AUTH_STORAGE_KEY}-user`, 'test-user');
  await AsyncStorage.setItem('user-theme', 'dark');
});

test('backend email login installs both tokens into the persisted renewable SDK session', async () => {
  const session = { user: { id: 'reviewer' }, access_token: 'access', refresh_token: 'refresh' };
  (supabase.auth.setSession as jest.Mock).mockResolvedValueOnce({ data: { session }, error: null });
  await expect(installBackendSession({ accessToken: 'access', refreshToken: 'refresh' })).resolves.toBe(session);
  expect(supabase.auth.setSession).toHaveBeenCalledWith({ access_token: 'access', refresh_token: 'refresh' });
  await expect(installBackendSession({ accessToken: 'access', refreshToken: '' })).rejects.toThrow('renewable');
});

test('removes only auth credentials and signs out locally', async () => {
  await clearDeletedAccountSession();
  expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(await AsyncStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  expect(await AsyncStorage.getItem(`${AUTH_STORAGE_KEY}-code-verifier`)).toBeNull();
  expect(await AsyncStorage.getItem(`${AUTH_STORAGE_KEY}-user`)).toBeNull();
  expect(await AsyncStorage.getItem('user-theme')).toBe('dark');
});

test('persisted credentials stay removed if SDK sign-out fails', async () => {
  (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({ error: new Error('Offline') });
  await expect(clearDeletedAccountSession()).rejects.toThrow('Offline');
  expect(await AsyncStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
});
