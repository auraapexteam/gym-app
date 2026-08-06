import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/api';
import { formatDate, isExpiringSoon, safeNewDate } from '@/utils';
import { toast } from 'sonner';
import type { Member } from '@/types';

export function useMembers(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: ['members', params],
    queryFn: async () => {
      const res = await membersApi.getAll(params);
      const rawItems = Array.isArray(res.data.data) ? res.data.data : [];
      const pagination = (res.data as any).meta?.pagination || {};
      
      // Map DTO fields to frontend Member layout
      const items: Member[] = rawItems.map((m: any) => ({
        id: m?.id || '',
        memberId: m?.id ? m.id.substring(0, 8).toUpperCase() : '',
        name: m?.fullName || m?.name || '',
        email: m.email || '',
        phone: m.phone || '',
        membershipStatus: m.status || 'inactive',
        membershipPlan: m.planName || (m.notes?.includes('Renewed plan:') ? m.notes.replace('Renewed plan: ', '') : 'No Active Plan'),
        renewDate: m.joinedAt ? new Date(safeNewDate(m.joinedAt).getTime() + 30 * 24 * 3600 * 1000).toISOString() : new Date().toISOString(),
        attendance: 0,
        visits: 0,
        gymId: m.gymId || '',
        joinedAt: m.joinedAt || new Date().toISOString(),
        createdAt: m.createdAt || new Date().toISOString(),
        updatedAt: m.updatedAt || new Date().toISOString(),
      }));

      return {
        success: true,
        data: items,
        total: pagination.total ?? items.length,
        page: pagination.page ?? 1,
        limit: pagination.limit ?? 10,
        totalPages: pagination.totalPages ?? 1,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ['member', id],
    queryFn: async () => {
      const res = await membersApi.getById(id);
      const m = res.data?.data as any;
      if (!m) return null;
      return {
        id: m?.id || '',
        memberId: m?.id ? m.id.substring(0, 8).toUpperCase() : '',
        name: m?.fullName || m?.name || '',
        email: m.email || '',
        phone: m.phone || '',
        avatar: m.avatar || '',
        membershipStatus: m.status || 'inactive',
        membershipPlan: m.planName || 'No Active Plan',
        renewDate: m.joinedAt ? new Date(safeNewDate(m.joinedAt).getTime() + 30 * 24 * 3600 * 1000).toISOString() : new Date().toISOString(),
        attendance: 0,
        visits: 0,
        trainerName: m.trainerName || '',
        dateOfBirth: m.dateOfBirth || '',
        address: m.address || '',
        notes: m.notes || '',
        emergencyContact: m.emergencyContact ? { name: 'Emergency Contact', phone: m.emergencyContact, relation: 'Family' } : undefined,
        gymId: m.gymId || '',
        joinedAt: m.joinedAt || new Date().toISOString(),
        createdAt: m.createdAt || new Date().toISOString(),
        updatedAt: m.updatedAt || new Date().toISOString(),
      };
    },
    enabled: !!id,
  });
}

export function useMemberProfile(id: string) {
  return useQuery({
    queryKey: ['members', id],
    queryFn: async () => {
      const res = await membersApi.getById(id);
      const m = res.data?.data as any;
      if (!m) return null;
      return {
        id: m?.id || '',
        memberId: m?.id ? m.id.substring(0, 8).toUpperCase() : '',
        name: m?.fullName || m?.name || '',
        email: m.email || '',
        phone: m.phone || '',
        avatar: m.avatar || '',
        membershipStatus: m.status || 'inactive',
        membershipPlan: m.planName || 'No Active Plan',
        renewDate: m.joinedAt ? new Date(safeNewDate(m.joinedAt).getTime() + 30 * 24 * 3600 * 1000).toISOString() : new Date().toISOString(),
        attendance: 0,
        visits: 0,
        trainerName: m.trainerName || '',
        dateOfBirth: m.dateOfBirth || '',
        address: m.address || '',
        notes: m.notes || '',
        emergencyContact: m.emergencyContact ? { name: 'Emergency Contact', phone: m.emergencyContact, relation: 'Family' } : undefined,
        gymId: m.gymId || '',
        joinedAt: m.joinedAt || new Date().toISOString(),
        createdAt: m.createdAt || new Date().toISOString(),
        updatedAt: m.updatedAt || new Date().toISOString(),
      };
    },
    enabled: !!id,
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member deleted successfully.');
    },
    onError: () => toast.error('Failed to delete member.'),
  });
}

export function useSuspendMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      membersApi.suspend(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member suspended.');
    },
    onError: () => toast.error('Failed to suspend member.'),
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => membersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member registered successfully.');
    },
    onError: () => toast.error('Failed to add member.'),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      membersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member profile updated.');
    },
    onError: () => toast.error('Failed to update member profile.'),
  });
}
