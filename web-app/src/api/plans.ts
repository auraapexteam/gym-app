import axiosInstance from './axios';
import type { MembershipPlan, ApiResponse, PaginatedResponse } from '@/types';

export const plansApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<PaginatedResponse<MembershipPlan>>('/plans', { params }),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<MembershipPlan>>(`/plans/${id}`),

  create: (data: Partial<MembershipPlan>) =>
    axiosInstance.post<ApiResponse<MembershipPlan>>('/plans', data),

  update: (id: string, data: Partial<MembershipPlan>) =>
    axiosInstance.patch<ApiResponse<MembershipPlan>>(`/plans/${id}`, data),

  delete: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/plans/${id}`),
};
