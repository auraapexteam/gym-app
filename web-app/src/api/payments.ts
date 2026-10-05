import axiosInstance from './axios';
import type { Payment, ApiResponse, PaginatedResponse, PaginationParams } from '@/types';

export interface PhysicalMembershipOrder {
  orderId: string; amount: number; amountInPaise: number; currency: string;
  razorpayKeyId: string; subscriptionId: string; paymentId: string; planName: string;
}

export const paymentsApi = {
  createOrder: (planId: string) => axiosInstance.post<ApiResponse<PhysicalMembershipOrder>>('/payments/orders', { planId }),
  verifyOrder: (data: { orderId: string; paymentId: string; signature: string }) =>
    axiosInstance.post<ApiResponse<unknown>>('/payments/verify', data),
  getAll: (params?: PaginationParams & { memberId?: string; status?: string }) =>
    axiosInstance.get<PaginatedResponse<Payment>>('/payments', { params }),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<Payment>>(`/payments/${id}`),

  refund: (id: string) =>
    axiosInstance.post<ApiResponse<any>>(`/payments/${id}/refund`),
};
