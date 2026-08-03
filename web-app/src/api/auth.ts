import axiosInstance from './axios';
import type { LoginPayload, RegisterPayload, OTPPayload, ApiResponse, User } from '@/types';

export interface AuthResponse {
  user: User;
  token: string;
}

interface BackendProfile {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: User['role'];
  gymId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface BackendAuthResponse {
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number | null;
    tokenType: 'bearer';
  };
  profile: BackendProfile;
}

const toUser = (profile: BackendProfile): User => ({
  id: profile.id,
  email: profile.email,
  name: profile.fullName || profile.email,
  role: (profile.role as string) === 'owner' ? 'gym_owner' : profile.role,
  avatar: profile.avatarUrl || undefined,
  phone: profile.phone || undefined,
  gymId: profile.gymId || undefined,
  isActive: profile.status === 'active',
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
});

const toAuthResponse = (data: BackendAuthResponse): AuthResponse => ({
  user: toUser(data.profile),
  token: data.session.accessToken,
});

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

  verifyOtp: (payload: OTPPayload) =>
    axiosInstance.post<ApiResponse<AuthResponse>>('/auth/verify-otp', payload),

  forgotPassword: (email: string) =>
    axiosInstance.post<ApiResponse<null>>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    axiosInstance.post<ApiResponse<null>>('/auth/reset-password', { token, password }),

  logout: () => axiosInstance.post<ApiResponse<null>>('/auth/logout'),

  me: () =>
    axiosInstance.get<ApiResponse<BackendProfile>>('/auth/me').then((res) => ({
      ...res,
      data: { ...res.data, data: toUser(res.data.data) },
    })),

  refreshToken: () => axiosInstance.post<ApiResponse<{ token: string }>>('/auth/refresh'),
};
