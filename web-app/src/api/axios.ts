import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/constants';
import { useAuthStore } from '@/store/auth.store';
import { toAuthResponse } from './auth.contract';
import type { BackendAuthResponse } from './auth.contract';
import type { ApiResponse } from '@/types';

type AccountRequest = InternalAxiosRequestConfig & { accountGeneration?: number; authRetried?: boolean };
const publicAuthRequest = (url = '') => /^\/auth\/(login|register|forgot-password|reset-password|phone-otp|verify-otp|refresh)$/.test(url);
export const refreshClient = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });
let refreshFlight: { generation: number; promise: Promise<string> } | null = null;

export async function refreshSession(generation = useAuthStore.getState().accountGeneration): Promise<string> {
  if (refreshFlight?.generation === generation) return refreshFlight.promise;
  const state = useAuthStore.getState();
  const promise = (async () => {
    if (!state.refreshToken) { state.logout(); throw new Error('Please sign in again.'); }
    try {
      const response = await refreshClient.post<ApiResponse<BackendAuthResponse>>('/auth/refresh', { refreshToken: state.refreshToken });
      if (generation !== useAuthStore.getState().accountGeneration) throw new Error('Account changed. Please retry.');
      const auth = toAuthResponse(response.data.data);
      if (auth.user.id !== state.user?.id) { state.logout(); throw new Error('Session account did not match. Please sign in again.'); }
      state.setAuth(auth.user, auth.token, { refreshToken: auth.refreshToken, expiresAt: auth.expiresAt });
      return auth.token;
    } catch (error) {
      if (generation === useAuthStore.getState().accountGeneration && axios.isAxiosError(error) &&
        [400, 401, 403].includes(error.response?.status ?? 0)) state.logout();
      throw error;
    }
  })();
  refreshFlight = { generation, promise };
  try { return await promise; }
  finally { if (refreshFlight?.promise === promise) refreshFlight = null; }
}

const axiosInstance = axios.create({ baseURL: API_BASE_URL, timeout: 30000, headers: { 'Content-Type': 'application/json' } });

axiosInstance.interceptors.request.use(async (config: AccountRequest) => {
  const state = useAuthStore.getState();
  if (config.accountGeneration !== undefined && config.accountGeneration !== state.accountGeneration) {
    throw new Error('Account changed. Please retry.');
  }
  config.accountGeneration = state.accountGeneration;
  if (publicAuthRequest(config.url)) { delete config.headers.Authorization; return config; }
  let token = state.token;
  if (token && state.expiresAt && state.expiresAt <= Date.now() / 1000 + 30) token = await refreshSession(state.accountGeneration);
  if (config.accountGeneration !== useAuthStore.getState().accountGeneration) throw new Error('Account changed. Please retry.');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else delete config.headers.Authorization;
  return config;
});

axiosInstance.interceptors.response.use(response => {
  if ((response.config as AccountRequest).accountGeneration !== useAuthStore.getState().accountGeneration) throw new Error('Account changed. Please retry.');
  return response;
}, async error => {
  const config = error.config as AccountRequest | undefined;
  const state = useAuthStore.getState();
  if (config && config.accountGeneration !== state.accountGeneration) throw new Error('Account changed. Please retry.');
  if (config && error.response?.status === 401 && !publicAuthRequest(config.url) && state.token) {
    if (!config.authRetried) {
      config.authRetried = true;
      if (config.headers.Authorization !== `Bearer ${state.token}`) return axiosInstance(config);
      await refreshSession(state.accountGeneration);
      if (config.accountGeneration !== useAuthStore.getState().accountGeneration) throw new Error('Account changed. Please retry.');
      return axiosInstance(config);
    }
    state.logout();
  }
  return Promise.reject(error);
});

export default axiosInstance;
