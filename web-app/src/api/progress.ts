import axiosInstance from './axios';
import type { ApiResponse } from '@/types';

export interface ProgressSummary {
  date: string;
  weightKg?: number;
  waterLiters?: number;
  proteinGrams?: number;
  imageUrl?: string;
}

export const progressApi = {
  getMonthSummary: (params?: { month?: string; year?: number }) =>
    axiosInstance.get<ApiResponse<ProgressSummary[]>>('/progress/month', { params }),

  logWeight: (data: { date: string; weightKg: number }) =>
    axiosInstance.post<ApiResponse<any>>('/progress/weight', data),

  logWater: (data: { date: string; amountLiters: number }) =>
    axiosInstance.post<ApiResponse<any>>('/progress/water', data),

  logProtein: (data: { date: string; amountGrams: number }) =>
    axiosInstance.post<ApiResponse<any>>('/progress/protein', data),
};
