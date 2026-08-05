import axiosInstance from './axios';
import type { ApiResponse } from '@/types';

export interface CreateStaffPayload {
  email: string;
  password?: string;
  fullName: string;
  permissions?: string[];
}

export const staffApi = {
  list: () =>
    axiosInstance.get<ApiResponse<any[]>>('/gyms/me/staff'),

  create: (data: CreateStaffPayload) =>
    axiosInstance.post<ApiResponse<any>>('/gyms/me/staff', data),

  delete: (id: string) =>
    axiosInstance.delete<ApiResponse<any>>(`/gyms/me/staff/${id}`),
};
