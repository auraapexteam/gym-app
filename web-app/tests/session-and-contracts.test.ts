import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { AxiosError } from 'axios';
import api, { refreshClient, refreshSession } from '../src/api/axios';
import { useAuthStore, accountQueryKey } from '../src/store/auth.store';
import { queryClient } from '../src/api/queryClient';
import { progressApi, toProgressSummary } from '../src/api/progress';
import { attendanceApi } from '../src/api/attendance';
import { paymentsApi } from '../src/api/payments';
import { payForPhysicalMembership } from '../src/api/physicalMembershipCheckout';
import type { User } from '../src/types';

const user = (id: string): User => ({ id, name: id, email: `${id}@example.invalid`, role: 'customer',
  isActive: true, createdAt: '', updatedAt: '' });
const backend = (id: string) => ({ profile: { ...user(id), fullName: id, phone: null, avatarUrl: null, gymId: null, status: 'active' },
  session: { accessToken: 'rotated-access', refreshToken: 'rotated-refresh', expiresAt: Math.ceil(Date.now() / 1000) + 3600, tokenType: 'bearer' } });
beforeEach(() => {
  vi.restoreAllMocks(); useAuthStore.getState().logout();
  useAuthStore.getState().setAuth(user('one'), 'access-one', { refreshToken: 'refresh-one', expiresAt: Math.ceil(Date.now() / 1000) + 3600 });
});
afterEach(() => vi.restoreAllMocks());

test('logout and account change clear cached data and change account query keys', () => {
  const firstKey = accountQueryKey(['progress']); queryClient.setQueryData(firstKey, ['private']);
  useAuthStore.getState().setAuth(user('two'), 'two', { refreshToken: 'refresh-two', expiresAt: null });
  expect(queryClient.getQueryData(firstKey)).toBeUndefined();
  expect(accountQueryKey(['progress'])).not.toEqual(firstKey);
  useAuthStore.getState().logout();
  expect(useAuthStore.getState()).toMatchObject({ token: null, refreshToken: null, user: null, isAuthenticated: false });
  expect(JSON.parse(localStorage.getItem('aura-auth')!).state.refreshToken).toBeNull();
});

test('concurrent refresh uses one request and preserves rotated renewable tokens', async () => {
  let finish!: (value: any) => void;
  const post = vi.spyOn(refreshClient, 'post').mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const first = refreshSession(); const second = refreshSession();
  finish({ data: { success: true, data: backend('one') } });
  expect(await Promise.all([first, second])).toEqual(['rotated-access', 'rotated-access']);
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'refresh-one' });
  expect(useAuthStore.getState().refreshToken).toBe('rotated-refresh');
});

test('rejected refresh clears private cache; a late previous-account refresh cannot replace new login', async () => {
  queryClient.setQueryData(['private'], 'private');
  vi.spyOn(refreshClient, 'post').mockRejectedValueOnce(new AxiosError('Expired', 'ERR_BAD_REQUEST', undefined, undefined,
    { status: 401 } as any));
  await expect(refreshSession()).rejects.toThrow('Expired');
  expect(queryClient.getQueryData(['private'])).toBeUndefined();
  useAuthStore.getState().setAuth(user('one'), 'one', { refreshToken: 'one', expiresAt: null });
  let finish!: (value: any) => void;
  vi.spyOn(refreshClient, 'post').mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const old = refreshSession();
  useAuthStore.getState().setAuth(user('two'), 'two', { refreshToken: 'two', expiresAt: null });
  finish({ data: { success: true, data: backend('one') } });
  await expect(old).rejects.toThrow('Account changed');
  expect(useAuthStore.getState().token).toBe('two');
});

test.each([503, 429])('retryable refresh HTTP %s preserves renewable credentials for retry', async status => {
  vi.spyOn(refreshClient, 'post').mockRejectedValueOnce(new AxiosError('Retry later', 'ERR_BAD_RESPONSE', undefined, undefined,
    { status } as any));
  await expect(refreshSession()).rejects.toThrow('Retry later');
  expect(useAuthStore.getState()).toMatchObject({ token: 'access-one', refreshToken: 'refresh-one', isAuthenticated: true });
});

test('401 refresh retries once with renewed token, while invalid login never logs out the current account', async () => {
  vi.spyOn(refreshClient, 'post').mockResolvedValueOnce({ data: { success: true, data: backend('one') } });
  let requests = 0;
  const adapter = vi.fn(async config => {
    requests++;
    if (requests === 1) throw new AxiosError('Expired', 'ERR_BAD_REQUEST', config, undefined, { status: 401, config } as any);
    return { config, data: { success: true }, status: 200, statusText: 'OK', headers: {} };
  });
  await api.get('/subscriptions/me', { adapter });
  expect(adapter).toHaveBeenCalledTimes(2);
  expect(adapter.mock.calls[1][0].headers.Authorization).toBe('Bearer rotated-access');
  await expect(api.post('/auth/login', {}, { adapter: async config => {
    expect(config.headers.Authorization).toBeUndefined();
    throw new AxiosError('Invalid', 'ERR_BAD_REQUEST', config, undefined, { status: 401, config } as any);
  } })).rejects.toThrow('Invalid');
  expect(useAuthStore.getState().user?.id).toBe('one');
});

test('late authenticated response is rejected after account switch', async () => {
  let finish!: (value: any) => void;
  let signal!: () => void;
  const started = new Promise<void>(resolve => { signal = resolve; });
  const request = api.get('/progress/month', { adapter: async config => {
    signal(); return new Promise<any>(done => { finish = data => done({ config, data, status: 200, statusText: 'OK', headers: {} }); });
  } });
  await started;
  useAuthStore.getState().logout();
  finish({ success: true, data: ['old-private-data'] });
  await expect(request).rejects.toThrow('Account changed');
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
});

test('a changed gym discovered during refresh cannot resend the previous gym POST', async () => {
  const refreshed = backend('one');
  refreshed.profile.gymId = 'new-gym' as any;
  vi.spyOn(refreshClient, 'post').mockResolvedValueOnce({ data: { success: true, data: refreshed } });
  const oldPost = vi.fn(async config => {
    throw new AxiosError('Expired', 'ERR_BAD_REQUEST', config, undefined, { status: 401, config } as any);
  });
  await expect(api.post('/members', { fullName: 'Old gym form' }, { adapter: oldPost })).rejects.toThrow('Account changed');
  expect(oldPost).toHaveBeenCalledTimes(1);
  expect(useAuthStore.getState().user?.gymId).toBe('new-gym');
  const newPost = vi.fn(async config => ({ config, data: { success: true }, status: 200, statusText: 'OK', headers: {} }));
  await api.post('/members', { fullName: 'New gym form' }, { adapter: newPost });
  expect(newPost.mock.calls[0][0].headers.Authorization).toBe('Bearer rotated-access');
});

test('a captured previous-context config is rejected before attaching the new credentials', async () => {
  const oldGeneration = useAuthStore.getState().accountGeneration;
  useAuthStore.getState().setAuth(user('two'), 'two', { refreshToken: 'refresh-two', expiresAt: null });
  const adapter = vi.fn();
  await expect(api({ url: '/members', method: 'POST', accountGeneration: oldGeneration,
    data: { fullName: 'Old account form' }, adapter } as any)).rejects.toThrow('Account changed');
  expect(adapter).not.toHaveBeenCalled();
});

test('progress adapters use backend date and units; object month response merges date rows including zero', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { success: true } } as any);
  await progressApi.logWeight({ date: '2026-10-04', weightKg: 70 });
  await progressApi.logWater({ date: '2026-10-04', amountLiters: 2.5 });
  await progressApi.logProtein({ date: '2026-10-04', amountGrams: 100 });
  await attendanceApi.checkIn({ qrCode: 'synthetic-qr' });
  expect(post.mock.calls.map(call => call.slice(0, 2))).toEqual([
    ['/progress/weight', { logDate: '2026-10-04', weight: 70 }],
    ['/progress/water', { logDate: '2026-10-04', amountMl: 2500 }],
    ['/progress/protein', { logDate: '2026-10-04', amountG: 100 }], ['/attendance/check-in', { token: 'synthetic-qr' }],
  ]);
  expect(toProgressSummary({ weightLogs: [{ log_date: '2026-10-04', weight: '70.5' }],
    waterLogs: [{ log_date: '2026-10-04', amount_ml: 0 }], proteinLogs: [{ log_date: '2026-10-03', amount_g: 90 }] })).toEqual([
    { date: '2026-10-04', weightKg: 70.5, waterLiters: 0 }, { date: '2026-10-03', proteinGrams: 90 },
  ]);
});

test('physical membership sends no manual activation or memberId and confirms only after server verification', async () => {
  const order = { orderId: 'order-one', amountInPaise: 10000, razorpayKeyId: 'public-checkout-key', planName: 'Gym access' };
  vi.spyOn(paymentsApi, 'createOrder').mockResolvedValue({ data: { success: true, data: order } } as any);
  const verify = vi.spyOn(paymentsApi, 'verifyOrder').mockResolvedValue({ data: { success: false } } as any);
  const open = vi.fn().mockResolvedValue({ razorpay_order_id: 'order-one', razorpay_payment_id: 'payment-one', razorpay_signature: 'signature' });
  await expect(payForPhysicalMembership('physical-plan', open)).rejects.toThrow('confirmation is pending');
  expect(paymentsApi.createOrder).toHaveBeenCalledWith('physical-plan');
  expect(verify).toHaveBeenCalledWith({ orderId: 'order-one', paymentId: 'payment-one', signature: 'signature' });
});
