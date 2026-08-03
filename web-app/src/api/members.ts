import axiosInstance from './axios';
import type { Member, MemberProfile, ApiResponse, PaginatedResponse, PaginationParams } from '@/types';

export const membersApi = {
  getAll: (params?: PaginationParams & { status?: string; planId?: string }) =>
    axiosInstance.get<PaginatedResponse<Member>>('/members', { params }),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<MemberProfile>>(`/members/${id}`),

  create: (data: Partial<Member>) =>
    axiosInstance.post<ApiResponse<Member>>('/members', data),

  update: (id: string, data: Partial<Member>) =>
    axiosInstance.patch<ApiResponse<Member>>(`/members/${id}`, data),

  delete: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/members/${id}`),

  suspend: (id: string, reason?: string) =>
    axiosInstance.patch<ApiResponse<Member>>(`/members/${id}`, { status: 'suspended', notes: reason }),

  freeze: (id: string, days: number) =>
    axiosInstance.patch<ApiResponse<Member>>(`/members/${id}`, { status: 'inactive', notes: `Frozen for ${days} days` }),

  renew: (id: string, planId: string) =>
    axiosInstance.patch<ApiResponse<Member>>(`/members/${id}`, { notes: `Renewed plan: ${planId}` }),

  assignTrainer: (id: string, trainerId: string) =>
    axiosInstance.post<ApiResponse<Member>>(`/members/${id}/assign-trainer`, { trainerId }),

  getQRCode: (id: string) =>
    axiosInstance.get<ApiResponse<{ qrCode: string }>>(`/members/${id}/qr-code`),

  exportCSV: (params?: PaginationParams) =>
    axiosInstance.get('/members/export', { params, responseType: 'blob' }),
};
