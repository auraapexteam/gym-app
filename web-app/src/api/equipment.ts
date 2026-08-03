import axiosInstance from './axios';
import type { Equipment, ApiResponse, PaginatedResponse, PaginationParams } from '@/types';

export const equipmentApi = {
  getAll: (params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<Equipment>>('/equipment', { params }),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<Equipment>>(`/equipment/${id}`),

  create: (data: any) =>
    axiosInstance.post<ApiResponse<Equipment>>('/equipment', data),

  update: (id: string, data: any) =>
    axiosInstance.patch<ApiResponse<Equipment>>(`/equipment/${id}`, data),

  delete: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/equipment/${id}`),
};
