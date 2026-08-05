import axiosInstance from './axios';
import type { ApiResponse } from '@/types';

export interface CreateManualSubscriptionPayload {
  memberId: string;
  planId: string;
  method?: 'cash' | 'card' | 'upi' | 'other';
}

export const subscriptionsApi = {
  createManual: (data: CreateManualSubscriptionPayload) =>
    axiosInstance.post<ApiResponse<any>>('/subscriptions/manual', data),

  list: (params?: { status?: string; memberId?: string }) =>
    axiosInstance.get<ApiResponse<any[]>>('/subscriptions', { params }),

  cancel: (id: string) =>
    axiosInstance.post<ApiResponse<any>>(`/subscriptions/${id}/cancel`),
};
