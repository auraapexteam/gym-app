import { useAuthStore } from '../src/store/useAuthStore';
import { useGymStore } from '../src/store/useGymStore';
import { apiClient } from '../src/api/client';
import { clearDeletedAccountSession } from '../src/api/supabase';

jest.mock('../src/api/client', () => ({ apiClient: { get: jest.fn(), patch: jest.fn(), delete: jest.fn() } }));
jest.mock('../src/api/supabase', () => ({ clearDeletedAccountSession: jest.fn() }));

const profile = (id: string) => ({ id, email: `${id}@example.invalid`, fullName: id, role: 'customer', gymId: null,
  status: 'active', onboardingCompleted: false });
const session = (id: string, token = id) => ({ user: { id }, access_token: token } as any);
beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.getState().clearSession();
  (apiClient.get as jest.Mock).mockResolvedValue({ data: { success: true, data: [] } });
  (clearDeletedAccountSession as jest.Mock).mockResolvedValue(undefined);
});

test('account switch clears cached membership and saved gyms; refreshed token preserves current cache', async () => {
  await useAuthStore.getState().setSession(session('one'), profile('one'));
  useAuthStore.setState({ subscription: { id: 'one-only', status: 'active' } });
  useGymStore.setState({ savedGymIds: ['one-gym'] });
  await useAuthStore.getState().setSession(session('one', 'renewed'));
  expect(useAuthStore.getState().accessToken).toBe('renewed');
  expect(useAuthStore.getState().subscription?.id).toBe('one-only');
  await useAuthStore.getState().setSession(session('two'), profile('two'));
  expect(useAuthStore.getState().subscription).toBeNull();
  expect(useGymStore.getState().savedGymIds).toEqual([]);
});

test('late profile response cannot restore a signed-out account, including sign-in to the same user again', async () => {
  await useAuthStore.getState().setSession(session('one'), profile('one'));
  let finish!: (value: any) => void;
  (apiClient.get as jest.Mock).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const loading = useAuthStore.getState().loadUserProfile();
  await useAuthStore.getState().signOut();
  await useAuthStore.getState().setSession(session('one', 'new-login'), { ...profile('one'), fullName: 'New profile' });
  finish({ data: { success: true, data: { ...profile('one'), fullName: 'Old profile' } } });
  await loading;
  expect(useAuthStore.getState().userProfile?.full_name).toBe('New profile');
});

test('session expiry clears account and gym caches', async () => {
  await useAuthStore.getState().setSession(session('one'), profile('one'));
  useGymStore.setState({ savedGymIds: ['one-gym'], myRequest: { id: 'one-request' } as any });
  await useAuthStore.getState().setSession(null);
  expect(useAuthStore.getState()).toMatchObject({ user: null, userProfile: null, accessToken: null, subscription: null });
  expect(useGymStore.getState()).toMatchObject({ savedGymIds: [], myRequest: null });
});

test('a verified same-account OAuth login can follow sign-out, but generic SDK events cannot reopen it', async () => {
  await useAuthStore.getState().setSession(session('oauth-user'), profile('oauth-user'));
  await useAuthStore.getState().signOut();
  await useAuthStore.getState().setSession(session('oauth-user', 'late-refresh'));
  expect(useAuthStore.getState().user).toBeNull();

  const intent = useAuthStore.getState().beginOAuthSignIn();
  expect(useAuthStore.getState().getOAuthSignInIntent()).toBe(intent);
  (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { success: true, data: profile('oauth-user') } });
  await useAuthStore.getState().setSession(session('oauth-user', 'new-oauth-login'), undefined, intent);
  expect(useAuthStore.getState().user?.id).toBe('oauth-user');
  expect(useAuthStore.getState().accessToken).toBe('new-oauth-login');
  expect(useAuthStore.getState().getOAuthSignInIntent()).toBeNull();
});

test('cancelled OAuth intent cannot reopen a signed-out account', async () => {
  await useAuthStore.getState().setSession(session('cancelled-user'), profile('cancelled-user'));
  await useAuthStore.getState().signOut();
  const intent = useAuthStore.getState().beginOAuthSignIn();
  useAuthStore.getState().cancelOAuthSignIn(intent);
  await useAuthStore.getState().setSession(session('cancelled-user', 'cancelled-callback'), undefined, intent);
  await useAuthStore.getState().setSession(session('cancelled-user', 'queued-sdk-event'));
  expect(useAuthStore.getState().user).toBeNull();
});

test('a new login is blocked while previous account cleanup is pending, then allowed after completion', async () => {
  await useAuthStore.getState().setSession(session('cleanup-user'), profile('cleanup-user'));
  let finish!: () => void;
  (clearDeletedAccountSession as jest.Mock).mockReturnValueOnce(new Promise<void>(resolve => { finish = resolve; }));
  const cleanup = useAuthStore.getState().signOut();
  expect(useAuthStore.getState().authCleanupPending).toBe(true);
  expect(useAuthStore.getState().user).toBeNull();
  expect(() => useAuthStore.getState().beginOAuthSignIn()).toThrow('cleanup');
  await useAuthStore.getState().setSession(session('new-user'), profile('new-user'));
  const generation = useAuthStore.getState().accountGeneration;
  await useAuthStore.getState().setSession(null);
  expect(useAuthStore.getState().user).toBeNull();
  expect(useAuthStore.getState().accountGeneration).toBe(generation);
  await Promise.resolve();
  finish();
  await cleanup;
  expect(useAuthStore.getState().authCleanupPending).toBe(false);
  expect(useAuthStore.getState().beginOAuthSignIn()).toBeGreaterThan(0);
  await useAuthStore.getState().setSession(session('new-user'), profile('new-user'));
  expect(useAuthStore.getState().user?.id).toBe('new-user');
});

test('failed cleanup releases the login block after settling and reports the incomplete removal', async () => {
  await useAuthStore.getState().setSession(session('failed-cleanup-user'), profile('failed-cleanup-user'));
  let fail!: (error: Error) => void;
  (clearDeletedAccountSession as jest.Mock).mockReturnValueOnce(new Promise<void>((_resolve, reject) => { fail = reject; }));
  const cleanup = useAuthStore.getState().signOut();
  const rejected = expect(cleanup).rejects.toThrow('saved credentials could not be fully cleared');
  expect(useAuthStore.getState().authCleanupPending).toBe(true);
  await Promise.resolve();
  fail(new Error('Keychain reset unavailable'));
  await rejected;
  expect(useAuthStore.getState().authCleanupPending).toBe(false);
  expect(useAuthStore.getState().user).toBeNull();
  expect(useAuthStore.getState().beginOAuthSignIn()).toBeGreaterThan(0);
});

test('confirmed account deletion blocks login until credential cleanup settles without repeating deletion', async () => {
  await useAuthStore.getState().setSession(session('deleted-cleanup-user'), profile('deleted-cleanup-user'));
  (apiClient.delete as jest.Mock).mockResolvedValueOnce({ status: 200, data: { success: true } });
  let finish!: () => void;
  let cleanupStarted!: () => void;
  const started = new Promise<void>(resolve => { cleanupStarted = resolve; });
  (clearDeletedAccountSession as jest.Mock).mockImplementationOnce(() => {
    cleanupStarted();
    return new Promise<void>(resolve => { finish = resolve; });
  });
  const deletion = useAuthStore.getState().deleteAccount();
  await started;
  expect(useAuthStore.getState()).toMatchObject({ authCleanupPending: true, deletingAccount: true, user: null });
  expect(() => useAuthStore.getState().beginOAuthSignIn()).toThrow('cleanup');
  finish();
  await expect(deletion).resolves.toEqual({ status: 'completed', localCleanupFailed: false });
  expect(useAuthStore.getState()).toMatchObject({ authCleanupPending: false, deletingAccount: false, user: null });
  expect(apiClient.delete).toHaveBeenCalledTimes(1);
});

test('an old OAuth callback cannot replace a newly selected account or cancel its new attempt', async () => {
  const oldIntent = useAuthStore.getState().beginOAuthSignIn();
  await useAuthStore.getState().setSession(session('next-user'), profile('next-user'));
  expect(useAuthStore.getState().getOAuthSignInIntent()).toBeNull();
  const newIntent = useAuthStore.getState().beginOAuthSignIn();
  useAuthStore.getState().cancelOAuthSignIn(oldIntent);
  expect(useAuthStore.getState().getOAuthSignInIntent()).toBe(newIntent);
  await useAuthStore.getState().setSession(session('old-user'), undefined, oldIntent);
  expect(useAuthStore.getState().user?.id).toBe('next-user');
});

test('OAuth intent expires instead of accepting an unrelated late callback', () => {
  const now = Date.now();
  const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
  const intent = useAuthStore.getState().beginOAuthSignIn();
  clock.mockReturnValue(now + 10 * 60 * 1000);
  expect(useAuthStore.getState().getOAuthSignInIntent()).toBeNull();
  useAuthStore.getState().cancelOAuthSignIn(intent);
  clock.mockRestore();
});

test('same-account gym or permission changes invalidate account caches', async () => {
  await useAuthStore.getState().setSession(session('one'), profile('one'));
  useGymStore.setState({ savedGymIds: ['old-gym'] });
  useAuthStore.setState({ subscription: { id: 'old-membership', status: 'active' } });
  const before = useAuthStore.getState().accountGeneration;
  await useAuthStore.getState().setSession(session('one'), { ...profile('one'), gymId: 'new-gym', role: 'staff' });
  expect(useAuthStore.getState().accountGeneration).toBeGreaterThan(before);
  expect(useGymStore.getState().savedGymIds).toEqual([]);
  expect(useAuthStore.getState().subscription).toBeNull();
});

test('onboarding waits for confirmed safe backend save and leaves the profile unchanged on error', async () => {
  await useAuthStore.getState().setSession(session('one'), profile('one'));
  (apiClient.patch as jest.Mock).mockRejectedValueOnce(new Error('Offline'));
  await expect(useAuthStore.getState().completeOnboarding({ weight_kg: 70, onboarding_completed: true })).rejects.toThrow('Offline');
  expect(useAuthStore.getState().userProfile?.onboarding_completed).toBe(false);
  expect(apiClient.patch).toHaveBeenCalledWith('/auth/me', { weightKg: 70, onboardingCompleted: true });
  await expect(useAuthStore.getState().completeOnboarding({ role: 'owner', gym_id: 'foreign' })).rejects.toThrow('permissions');
  expect(apiClient.patch).toHaveBeenCalledTimes(1);
});

test('confirmed onboarding is taken from server response, never from optimistic client permission fields', async () => {
  await useAuthStore.getState().setSession(session('one'), profile('one'));
  (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: { success: true, data: { ...profile('one'),
    onboardingCompleted: true, weightKg: 70, hasHealthCondition: false } } });
  await useAuthStore.getState().completeOnboarding({ weight_kg: 70, has_health_condition: false, onboarding_completed: true });
  expect(useAuthStore.getState().userProfile).toMatchObject({ role: 'customer', gym_id: null, weight_kg: 70,
    has_health_condition: false, onboarding_completed: true });
});
