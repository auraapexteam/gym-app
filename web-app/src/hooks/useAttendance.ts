import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/api';
import { toast } from 'sonner';
import type { CheckIn } from '@/types';

export function useAttendance(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: async () => {
      try {
        const res = await attendanceApi.getAll(params);
        return res.data.data || [];
      } catch {
        return [];
      }
    },
  });
}

export function useAttendanceStats() {
  return useQuery({
    queryKey: ['attendance-stats'],
    queryFn: async () => {
      try {
        const res = await attendanceApi.stats();
        return res.data.data;
      } catch {
        return null;
      }
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
    onError: () => toast.error('Failed to register check-in.'),
  });
}
