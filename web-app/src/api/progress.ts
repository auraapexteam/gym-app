import axiosInstance from './axios';
import type { ApiResponse } from '@/types';

export interface ProgressSummary {
  date: string;
  weightKg?: number;
  waterLiters?: number;
  proteinGrams?: number;
  imageUrl?: string;
}

export interface MonthLogs {
  weightLogs: { log_date: string; weight: number | string }[];
  waterLogs: { log_date: string; amount_ml: number }[];
  proteinLogs: { log_date: string; amount_g: number }[];
}

export function toProgressSummary(logs: MonthLogs): ProgressSummary[] {
  const days = new Map<string, ProgressSummary>();
  const day = (date: string) => { if (!days.has(date)) days.set(date, { date }); return days.get(date)!; };
  for (const row of logs.weightLogs ?? []) day(row.log_date).weightKg = Number(row.weight);
  for (const row of logs.waterLogs ?? []) day(row.log_date).waterLiters = row.amount_ml / 1000;
  for (const row of logs.proteinLogs ?? []) day(row.log_date).proteinGrams = row.amount_g;
  return [...days.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export const progressApi = {
  getMonthSummary: (params = { month: new Date().getMonth() + 1, year: new Date().getFullYear() }) =>
    axiosInstance.get<ApiResponse<MonthLogs>>('/progress/month', { params }).then(res => ({ ...res,
      data: { ...res.data, data: toProgressSummary(res.data.data) } })),

  logWeight: (data: { date: string; weightKg: number }) =>
    axiosInstance.post<ApiResponse<any>>('/progress/weight', { logDate: data.date, weight: data.weightKg }),

  logWater: (data: { date: string; amountLiters: number }) =>
    axiosInstance.post<ApiResponse<any>>('/progress/water', { logDate: data.date, amountMl: Math.round(data.amountLiters * 1000) }),

  logProtein: (data: { date: string; amountGrams: number }) =>
    axiosInstance.post<ApiResponse<any>>('/progress/protein', { logDate: data.date, amountG: data.amountGrams }),
};
