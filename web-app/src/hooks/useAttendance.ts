import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/api';
import { toast } from 'sonner';
import type { CheckIn } from '@/types';

export function useAttendance(params?: { page?: number; limit?: number; memberId?: string }) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: async () => {
      const res = await attendanceApi.getAll(params);
      return res.data.data || [];
    },
  });
}

export function useAttendanceStats() {
  return useQuery({
    queryKey: ['attendance-stats'],
    queryFn: async () => {
      const res = await attendanceApi.stats();
      return res.data.data;
    },
  });
}

export function useManualCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { memberId: string }) => attendanceApi.manualCheckIn(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-stats'] });
      toast.success('Member checked in successfully.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to register check-in.';
      toast.error(msg);
    },
  });
}

export function useQrCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (qrCode: string) => attendanceApi.checkIn({ qrCode }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-stats'] });
      toast.success('Check-in recorded! Enjoy your workout session.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Invalid or expired reception QR Code.';
      toast.error(msg);
    },
  });
}
