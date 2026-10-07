import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from './supabase';
import type { InternalAxiosRequestConfig } from 'axios';

type AccountRequest = InternalAxiosRequestConfig & { accountGeneration?: number; authRetried?: boolean };
let refreshFlight: { generation: number; promise: Promise<string> } | null = null;
const publicAuthRequest = (url = '') => /^\/auth\/(login|register|forgot-password|reset-password|phone-otp|verify-otp)$/.test(url);
const retryableAuthError = (error: { status?: number } | null) => !!error &&
  (error.status == null || error.status === 429 || error.status >= 500);

async function refreshForAccount(generation: number): Promise<string> {
  if (refreshFlight?.generation === generation) return refreshFlight.promise;
  const userId = useAuthStore.getState().user?.id;
  const promise = (async () => {
    const { data, error } = await supabase.auth.refreshSession();
    const state = useAuthStore.getState();
    if (generation !== state.accountGeneration) throw new Error('Account changed. Please retry.');
    if (retryableAuthError(error)) throw new Error('Session renewal is temporarily unavailable. Please retry when connected.');
    if (error || !data.session || data.session.user.id !== userId) {
      await state.signOut();
      throw new Error('Your session expired. Please sign in again.');
    }
    state.updateAccessToken(data.session.user.id, data.session.access_token);
    return data.session.access_token;
  })();
  refreshFlight = { generation, promise };
  try { return await promise; }
  finally { if (refreshFlight?.promise === promise) refreshFlight = null; }
}

const cleanBaseUrl = (url: string) => {
  const fallback = 'https://gym-app-xtru.onrender.com/api/v1';
  const target = (url && url.trim().length > 0) ? url : fallback;
  const clean = target.trim().replace(/\/+$/, '');
  return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
};

export const apiClient = axios.create({
  baseURL: cleanBaseUrl(API_BASE_URL),
  timeout: 15000, // 15 seconds — prevents silent infinite hangs
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject Supabase JWT on every request
apiClient.interceptors.request.use(
  async (config: AccountRequest) => {
    const state = useAuthStore.getState();
    if (config.accountGeneration !== undefined && config.accountGeneration !== state.accountGeneration) {
      throw new Error('Account changed. Please retry.');
    }
    config.accountGeneration = state.accountGeneration;
    if (publicAuthRequest(config.url)) {
      if (state.authCleanupPending) throw new Error('Please wait for sign-out cleanup to finish.');
      delete config.headers.Authorization;
      return config;
    }
    if (state.user && state.accessToken) {
      // getSession refreshes expired persisted sessions through the SDK.
      const { data, error } = await supabase.auth.getSession();
      if (config.accountGeneration !== useAuthStore.getState().accountGeneration) throw new Error('Account changed. Please retry.');
      if (retryableAuthError(error)) throw new Error('Session renewal is temporarily unavailable. Please retry when connected.');
      if (error || !data.session || data.session.user.id !== state.user.id) {
        await state.signOut();
        throw new Error('Your session expired. Please sign in again.');
      }
      state.updateAccessToken(state.user.id, data.session.access_token);
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Surface backend error messages rather than raw Axios errors
apiClient.interceptors.response.use(
  (response) => {
    const config = response.config as AccountRequest;
    if (config.accountGeneration !== useAuthStore.getState().accountGeneration) throw new Error('Account changed. Please retry.');
    return response;
  },
  async (error) => {
    const config = error.config as AccountRequest | undefined;
    const state = useAuthStore.getState();
    if (config && config.accountGeneration !== state.accountGeneration) throw new Error('Account changed. Please retry.');
    if (error.response?.status === 401 && config && !publicAuthRequest(config.url) && state.user) {
      if (!config.authRetried) {
        config.authRetried = true;
        if (config.headers.Authorization !== `Bearer ${state.accessToken}`) return apiClient(config);
        const token = await refreshForAccount(state.accountGeneration);
        if (config.accountGeneration !== useAuthStore.getState().accountGeneration) throw new Error('Account changed. Please retry.');
        config.headers.Authorization = `Bearer ${token}`;
        return apiClient(config);
      }
      await state.signOut();
    }
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Check your internet connection and try again.';
    } else if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);
