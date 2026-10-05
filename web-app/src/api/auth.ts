import axiosInstance, { refreshClient } from './axios';
import { useAuthStore } from '@/store/auth.store';
import type { LoginPayload, RegisterPayload, ApiResponse, User } from '@/types';
import { toAuthResponse, toUser } from './auth.contract';
import type { BackendProfile, BackendAuthResponse } from './auth.contract';

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: number | null;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    axiosInstance
      .post<ApiResponse<BackendAuthResponse>>('/auth/login', payload)
      .then((res) => ({
        ...res,
        data: { ...res.data, data: toAuthResponse(res.data.data) },
      })),

  register: (payload: RegisterPayload) =>
    axiosInstance
      .post<ApiResponse<BackendAuthResponse>>('/auth/register', {
        email: payload.email,
        password: payload.password,
        fullName: payload.name,
        phone: payload.phone,
      })
      .then((res) => ({
        ...res,
        data: { ...res.data, data: toAuthResponse(res.data.data) },
      })),

  forgotPassword: (email: string) =>
    axiosInstance.post<ApiResponse<null>>('/auth/forgot-password', { email }),

  resetPassword: (accessToken: string, password: string) =>
    axiosInstance.post<ApiResponse<null>>('/auth/reset-password', { accessToken, password }),

  logout: async () => {
    const token = useAuthStore.getState().token;
    useAuthStore.getState().logout();
    if (token) await refreshClient.post<ApiResponse<null>>('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
  },

  deleteAccount: () => axiosInstance.delete<ApiResponse<null>>('/auth/account'),

  me: () =>
    axiosInstance.get<ApiResponse<BackendProfile>>('/auth/me').then((res) => ({
      ...res,
      data: { ...res.data, data: toUser(res.data.data) },
    })),
};
