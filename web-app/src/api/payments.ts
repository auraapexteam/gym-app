import axiosInstance from './axios';
import type { Payment, ApiResponse, PaginatedResponse, PaginationParams } from '@/types';

export const paymentsApi = {
  getAll: (params?: PaginationParams) =>
    axiosInstance.get<PaginatedResponse<Payment>>('/payments', { params }),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<Payment>>(`/payments/${id}`),

  refund: (id: string) =>
    axiosInstance.post<ApiResponse<any>>(`/payments/${id}/refund`),
};
