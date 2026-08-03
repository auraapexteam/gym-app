import axiosInstance from './axios';
import type { Trainer, ApiResponse, PaginatedResponse, PaginationParams } from '@/types';

export const trainersApi = {
  getAll: (params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<Trainer>>('/trainers', { params }),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<Trainer>>(`/trainers/${id}`),

  create: (data: any) =>
    axiosInstance.post<ApiResponse<Trainer>>('/trainers', data),

  update: (id: string, data: any) =>
    axiosInstance.patch<ApiResponse<Trainer>>(`/trainers/${id}`, data),

  delete: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/trainers/${id}`),
};
