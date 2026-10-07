import { apiClient } from '../src/api/client';

jest.mock('../src/config', () => ({ API_BASE_URL: 'https://example.invalid/api/v1' }));
jest.mock('../src/store/useAuthStore', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'reviewer' }, accountGeneration: 1,
    accessToken: 'test-bearer-token', updateAccessToken: jest.fn() }) },
}));
jest.mock('../src/api/supabase', () => ({ supabase: { auth: {
  getSession: jest.fn().mockResolvedValue({ data: { session: { user: { id: 'reviewer' }, access_token: 'test-bearer-token' } }, error: null }),
} } }));

test('deletion uses the versioned backend URL and current Bearer token without a user-ID payload', async () => {
  const adapter = jest.fn(async config => ({
    config, data: { success: true }, status: 200, statusText: 'OK', headers: {},
  }));
  // Exercise the real Axios request interceptor without making a network request.
  const response = await apiClient.delete('/auth/account', { adapter });
  const config = adapter.mock.calls[0][0];
  expect(config.baseURL).toBe('https://example.invalid/api/v1');
  expect(config.url).toBe('/auth/account');
  expect(config.method).toBe('delete');
  expect(config.headers.Authorization).toBe('Bearer test-bearer-token');
  expect(config.data).toBeUndefined();
  expect(response.data.success).toBe(true);
});
