import axiosInstance from './axios';
import type { ApiResponse } from '@/types';

export interface QrCodeData {
  id: string;
  qrValue: string;
  label?: string;
  status: 'active' | 'revoked';
  createdAt: string;
  expiresAt?: string;
}

export const qrApi = {
  getActive: () =>
    axiosInstance.get<ApiResponse<QrCodeData>>('/qr/active'),

  generate: (label?: string) =>
    axiosInstance.post<ApiResponse<QrCodeData>>('/qr/generate', { label }),

  list: () =>
    axiosInstance.get<ApiResponse<QrCodeData[]>>('/qr'),

  revoke: (id: string) =>
    axiosInstance.post<ApiResponse<any>>(`/qr/${id}/revoke`),
};
