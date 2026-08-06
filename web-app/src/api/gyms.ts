import axiosInstance from './axios';
import type { ApiResponse } from '@/types';

export interface PublicGym {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  capacity?: number;
  logoUrl?: string;
  galleryCount?: number;
}

export interface JoinRequest {
  id: string;
  gymId: string;
  gymName?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export const gymsApi = {
  listDirectory: () =>
    axiosInstance.get<ApiResponse<PublicGym[]>>('/gyms/directory'),

  getMine: () =>
    axiosInstance.get<ApiResponse<any>>('/gyms/me'),

  createJoinRequest: (data: { gymId: string; notes?: string }) =>
    axiosInstance.post<ApiResponse<JoinRequest>>('/gyms/join-request', data),

  getJoinStatus: () =>
    axiosInstance.get<ApiResponse<JoinRequest | null>>('/gyms/join-request/status'),

  listPendingRequests: () =>
    axiosInstance.get<ApiResponse<JoinRequest[]>>('/gyms/join-requests/pending'),

  approveRequest: (id: string) =>
    axiosInstance.patch<ApiResponse<any>>(`/gyms/join-requests/${id}/approve`),

  rejectRequest: (id: string) =>
    axiosInstance.patch<ApiResponse<any>>(`/gyms/join-requests/${id}/reject`),
};
