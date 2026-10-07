import { apiClient } from '../src/api/client';
import { supabase } from '../src/api/supabase';
import { AxiosError } from 'axios';

let mockAuth: any;
jest.mock('../src/config', () => ({ API_BASE_URL: 'https://api.example.invalid/api/v1' }));
jest.mock('../src/store/useAuthStore', () => ({ useAuthStore: { getState: () => mockAuth } }));
jest.mock('../src/api/supabase', () => ({ supabase: { auth: { getSession: jest.fn(), refreshSession: jest.fn() } } }));
beforeEach(() => {
  jest.clearAllMocks();
  mockAuth = { user: { id: 'one' }, accessToken: 'access', accountGeneration: 1,
    updateAccessToken: jest.fn((_id: string, token: string) => { mockAuth.accessToken = token; }),
    signOut: jest.fn(async () => { mockAuth.user = null; mockAuth.accessToken = null; mockAuth.accountGeneration++; }),
  };
  (supabase.auth.getSession as jest.Mock).mockImplementation(async () => ({ data: {
    session: { user: { id: mockAuth.user?.id }, access_token: mockAuth.accessToken } }, error: null }));
});

test('expired API token is renewed once and request retries with the SDK token', async () => {
  (supabase.auth.refreshSession as jest.Mock).mockResolvedValueOnce({ data: { session: { user: { id: 'one' }, access_token: 'renewed' } }, error: null });
  const adapter = jest.fn(async config => {
    if (config.headers.Authorization === 'Bearer access') throw new AxiosError('Expired', 'ERR_BAD_REQUEST', config, undefined, { status: 401, config } as any);
    return { config, data: { success: true }, status: 200, statusText: 'OK', headers: {} };
  });
  await apiClient.get('/subscriptions/me', { adapter });
  expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1);
  expect(adapter.mock.calls[1][0].headers.Authorization).toBe('Bearer renewed');
  expect(mockAuth.signOut).not.toHaveBeenCalled();
});

test.each([503, 429])('retryable SDK renewal HTTP %s preserves the account for retry', async status => {
  (supabase.auth.refreshSession as jest.Mock).mockResolvedValueOnce({ data: { session: null }, error: { status } });
  await expect(apiClient.get('/subscriptions/me', { adapter: async config => {
    throw new AxiosError('Expired', 'ERR_BAD_REQUEST', config, undefined, { status: 401, config } as any);
  } })).rejects.toThrow('temporarily unavailable');
  expect(mockAuth.signOut).not.toHaveBeenCalled();
  expect(mockAuth.accessToken).toBe('access');
});

test('invalid refresh credentials sign out; invalid login never sends the previous account token', async () => {
  (supabase.auth.refreshSession as jest.Mock).mockResolvedValueOnce({ data: { session: null }, error: { status: 401 } });
  await expect(apiClient.get('/subscriptions/me', { adapter: async config => {
    throw new AxiosError('Expired', 'ERR_BAD_REQUEST', config, undefined, { status: 401, config } as any);
  } })).rejects.toThrow('expired');
  expect(mockAuth.signOut).toHaveBeenCalledTimes(1);
  mockAuth.user = { id: 'two' }; mockAuth.accessToken = 'two';
  await expect(apiClient.post('/auth/login', {}, { adapter: async config => {
    expect(config.headers.Authorization).toBeUndefined();
    throw new AxiosError('Invalid', 'ERR_BAD_REQUEST', config, undefined, { status: 401, config } as any);
  } })).rejects.toThrow('Invalid');
  expect(mockAuth.accessToken).toBe('two');
});

test('an account change during renewal prevents resending the old POST; new requests use the new context', async () => {
  (supabase.auth.refreshSession as jest.Mock).mockImplementationOnce(async () => {
    mockAuth = { ...mockAuth, user: { id: 'two' }, accessToken: 'two-access', accountGeneration: 2 };
    return { data: { session: { user: { id: 'one' }, access_token: 'one-renewed' } }, error: null };
  });
  const oldPost = jest.fn(async config => {
    throw new AxiosError('Expired', 'ERR_BAD_REQUEST', config, undefined, { status: 401, config } as any);
  });
  await expect(apiClient.post('/progress/weight', { logDate: '2026-10-04', weight: 70 }, { adapter: oldPost }))
    .rejects.toThrow('Account changed');
  expect(oldPost).toHaveBeenCalledTimes(1);
  expect(mockAuth.signOut).not.toHaveBeenCalled();
  const newPost = jest.fn(async config => ({ config, data: { success: true }, status: 200, statusText: 'OK', headers: {} }));
  await apiClient.post('/progress/weight', { logDate: '2026-10-04', weight: 80 }, { adapter: newPost });
  expect(newPost.mock.calls[0][0].headers.Authorization).toBe('Bearer two-access');
});

test('a captured previous-context config cannot acquire the new account token on retry', async () => {
  const adapter = jest.fn();
  mockAuth.accountGeneration = 2;
  await expect(apiClient({ url: '/progress/weight', method: 'POST', accountGeneration: 1,
    data: { logDate: '2026-10-04', weight: 70 }, adapter } as any)).rejects.toThrow('Account changed');
  expect(adapter).not.toHaveBeenCalled();
});

test('a login request cannot install credentials during an earlier sign-out cleanup', async () => {
  mockAuth.authCleanupPending = true;
  const adapter = jest.fn();
  await expect(apiClient.post('/auth/login', { email: 'synthetic@example.invalid', password: 'synthetic' }, { adapter }))
    .rejects.toThrow('cleanup');
  expect(adapter).not.toHaveBeenCalled();
});
