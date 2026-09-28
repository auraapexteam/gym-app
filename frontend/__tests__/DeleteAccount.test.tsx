import React from 'react';
import { Alert, Platform, TouchableOpacity } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { DeleteAccountButton } from '../src/components/DeleteAccountButton';
import { useAuthStore } from '../src/store/useAuthStore';
import { useGymStore } from '../src/store/useGymStore';
import { apiClient } from '../src/api/client';
import { clearDeletedAccountSession, supabase } from '../src/api/supabase';
import { PrivacySettingsScreen } from '../src/screens/PrivacySettingsScreen';

jest.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({ colors: require('../src/theme/colors').darkColors, isDark: true }),
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));

jest.mock('../src/api/client', () => ({ apiClient: { delete: jest.fn(), get: jest.fn() } }));
jest.mock('../src/api/supabase', () => ({
  clearDeletedAccountSession: jest.fn().mockResolvedValue(undefined),
  supabase: { from: jest.fn() },
}));

let tree: Renderer.ReactTestRenderer | undefined;
let userNumber = 0;
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  (clearDeletedAccountSession as jest.Mock).mockResolvedValue(undefined);
  (apiClient.delete as jest.Mock).mockResolvedValue({ data: { success: true } });
  useAuthStore.setState({
    user: { id: `delete-test-${++userNumber}` } as any,
    userProfile: { role: 'customer', full_name: 'Test member' } as any,
    accessToken: 'test-token', subscription: { id: 'test-plan', status: 'active' },
    deletingAccount: false, initializing: false,
  });
  useGymStore.setState({ savedGymIds: ['test-gym'], myRequest: { id: 'request' } as any });
});
afterEach(() => {
  if (tree) act(() => tree!.unmount());
  tree = undefined;
  jest.restoreAllMocks();
});

async function renderAndPress() {
  await act(async () => { tree = Renderer.create(<DeleteAccountButton />); });
  act(() => tree!.root.findByType(TouchableOpacity).props.onPress());
}
function confirmation() {
  return (Alert.alert as jest.Mock).mock.calls[0][2];
}

test.each(['ios', 'android'] as const)('requires confirmation and permits cancel on %s', async os => {
  jest.replaceProperty(Platform, 'OS', os);
  await renderAndPress();
  expect(Alert.alert).toHaveBeenCalledWith(
    'Permanently delete your account?', expect.stringContaining('memberships'),
    expect.any(Array), expect.objectContaining({ cancelable: true })
  );
  act(() => confirmation()[0].onPress());
  expect(apiClient.delete).not.toHaveBeenCalled();
  expect(useAuthStore.getState().accessToken).toBe('test-token');
});

test('privacy settings exposes the connected deletion button', async () => {
  await act(async () => { tree = Renderer.create(<PrivacySettingsScreen />); });
  const button = tree!.root.findByType(DeleteAccountButton).findByType(TouchableOpacity);
  act(() => button.props.onPress());
  await act(async () => { await confirmation()[1].onPress(); });
  expect(apiClient.delete).toHaveBeenCalledWith('/auth/account');
});

test('deletes once, clears account and gym state, and prevents stale auth restore', async () => {
  const oldUser = useAuthStore.getState().user;
  await renderAndPress();
  await act(async () => { await confirmation()[1].onPress(); });
  expect(apiClient.delete).toHaveBeenCalledTimes(1);
  expect(apiClient.delete).toHaveBeenCalledWith('/auth/account');
  expect(clearDeletedAccountSession).toHaveBeenCalledTimes(1);
  expect(useAuthStore.getState()).toMatchObject({ user: null, userProfile: null, accessToken: null, subscription: null });
  expect(useGymStore.getState()).toMatchObject({ savedGymIds: [], myRequest: null });
  await act(async () => { await useAuthStore.getState().setSession({ user: oldUser, access_token: 'stale' }); });
  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(Alert.alert).toHaveBeenLastCalledWith('Account deleted', expect.stringContaining('signed out'));
});

test.each([401, 403, 500])('keeps the session and shows failure for HTTP %s', async status => {
  (apiClient.delete as jest.Mock).mockRejectedValueOnce({ response: { status } });
  await renderAndPress();
  await act(async () => { await confirmation()[1].onPress(); });
  expect(useAuthStore.getState().accessToken).toBe('test-token');
  expect(clearDeletedAccountSession).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenLastCalledWith('Deletion not confirmed', expect.any(String));
});

test('does not claim the account survived a timeout', async () => {
  (apiClient.delete as jest.Mock).mockRejectedValueOnce({ code: 'ECONNABORTED' });
  await renderAndPress();
  await act(async () => { await confirmation()[1].onPress(); });
  expect(Alert.alert).toHaveBeenLastCalledWith('Deletion not confirmed', expect.stringContaining('could not confirm deletion'));
  expect(clearDeletedAccountSession).not.toHaveBeenCalled();
});

test('rejects an unconfirmed response body', async () => {
  (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: { success: false } });
  await expect(useAuthStore.getState().deleteAccount()).rejects.toThrow('not confirmed');
  expect(useAuthStore.getState().accessToken).toBe('test-token');
  expect(clearDeletedAccountSession).not.toHaveBeenCalled();
});

test('disables the action while pending and prevents duplicate DELETE requests', async () => {
  let finish!: (result: any) => void;
  (apiClient.delete as jest.Mock).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  await renderAndPress();
  let pending!: Promise<void>;
  act(() => { pending = confirmation()[1].onPress(); });
  expect(tree!.root.findByType(TouchableOpacity).props.disabled).toBe(true);
  await expect(useAuthStore.getState().deleteAccount()).rejects.toThrow('already in progress');
  expect(apiClient.delete).toHaveBeenCalledTimes(1);
  await act(async () => { finish({ data: { success: true } }); await pending; });
});

test('reports cleanup trouble separately from a successful server deletion', async () => {
  (clearDeletedAccountSession as jest.Mock).mockRejectedValueOnce(new Error('Storage unavailable'));
  await renderAndPress();
  await act(async () => { await confirmation()[1].onPress(); });
  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(Alert.alert).toHaveBeenLastCalledWith('Account deleted', expect.stringContaining('clear the app storage'));
});

test('protects super-admin accounts and requires a signed-in user', async () => {
  useAuthStore.setState({ userProfile: { role: 'super_admin' } as any });
  await expect(useAuthStore.getState().deleteAccount()).rejects.toThrow('Super admin');
  useAuthStore.setState({ user: null, accessToken: null });
  await expect(useAuthStore.getState().deleteAccount()).rejects.toThrow('sign in again');
  expect(apiClient.delete).not.toHaveBeenCalled();
});

test('late profile response cannot recreate deleted profile state', async () => {
  let finish!: (result: any) => void;
  const result = new Promise(resolve => { finish = resolve; });
  const upsert = jest.fn();
  (supabase.from as jest.Mock).mockReturnValue({
    select: () => ({ eq: () => ({ maybeSingle: () => result }) }), upsert,
  });
  const loading = useAuthStore.getState().loadUserProfile();
  await useAuthStore.getState().deleteAccount();
  finish({ data: null, error: null });
  await loading;
  expect(upsert).not.toHaveBeenCalled();
  expect(useAuthStore.getState().userProfile).toBeNull();
});

test('late membership and saved-gym responses cannot repopulate deleted state', async () => {
  let finish!: (result: any) => void;
  const result = new Promise(resolve => { finish = resolve; });
  (apiClient.get as jest.Mock).mockReturnValue(result);
  const subscription = useAuthStore.getState().loadSubscription();
  const gyms = useGymStore.getState().fetchSavedGyms();
  await useAuthStore.getState().deleteAccount();
  finish({ data: { success: true, data: [{ id: 'old', status: 'active' }] } });
  await Promise.all([subscription, gyms]);
  expect(useAuthStore.getState().subscription).toBeNull();
  expect(useGymStore.getState().savedGyms).toEqual([]);
});
