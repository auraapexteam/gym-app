import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi, CreateStaffPayload } from '@/api/staff';
import { toast } from 'sonner';

export function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await staffApi.list();
      const raw = Array.isArray(res.data.data) ? res.data.data : [];

      return raw.map((s: any) => ({
        id: s.id,
        name: s.profiles?.full_name || s.fullName || s.name || 'Staff Member',
        email: s.profiles?.email || s.email || '',
        role: s.role || 'receptionist',
        shift: 'Morning Shift (6 AM – 2 PM)',
        salary: 25000,
        attendance: 95,
        joinedAt: s.created_at || s.createdAt || new Date().toISOString(),
        status: s.status || 'active',
      }));
    },
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffPayload) => staffApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member onboarded successfully.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to onboard staff member.';
      toast.error(msg);
    },
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member account removed.');
    },
    onError: () => toast.error('Failed to remove staff member.'),
  });
}
