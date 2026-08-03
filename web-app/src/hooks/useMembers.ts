import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/api';
import { toast } from 'sonner';
import type { Member } from '@/types';

// Mock data for demo
const mockMembers: Member[] = [
  { id: '1', memberId: 'MEM001', name: 'Arjun Sharma', email: 'arjun@gmail.com', phone: '9876543210', membershipPlan: 'Premium', membershipStatus: 'active', renewDate: new Date(Date.now() + 15 * 24 * 3600000).toISOString(), attendance: 92, visits: 148, trainerName: 'Raj Kumar', gymId: 'g1', joinedAt: '2024-01-15', createdAt: '2024-01-15', updatedAt: '2024-07-14' },
  { id: '2', memberId: 'MEM002', name: 'Priya Patel', email: 'priya@gmail.com', phone: '9765432109', membershipPlan: 'Monthly', membershipStatus: 'active', renewDate: new Date(Date.now() + 3 * 24 * 3600000).toISOString(), attendance: 78, visits: 64, gymId: 'g1', joinedAt: '2024-03-01', createdAt: '2024-03-01', updatedAt: '2024-07-14' },
  { id: '3', memberId: 'MEM003', name: 'Rahul Gupta', email: 'rahul@gmail.com', phone: '9654321098', membershipPlan: 'Yearly', membershipStatus: 'expired', renewDate: new Date(Date.now() - 5 * 24 * 3600000).toISOString(), attendance: 45, visits: 230, trainerName: 'Meera Singh', gymId: 'g1', joinedAt: '2023-07-10', createdAt: '2023-07-10', updatedAt: '2024-07-09' },
  { id: '4', memberId: 'MEM004', name: 'Sneha Singh', email: 'sneha@gmail.com', phone: '9543210987', membershipPlan: 'VIP', membershipStatus: 'active', renewDate: new Date(Date.now() + 180 * 24 * 3600000).toISOString(), attendance: 95, visits: 320, trainerName: 'Raj Kumar', gymId: 'g1', joinedAt: '2023-01-05', createdAt: '2023-01-05', updatedAt: '2024-07-14' },
  { id: '5', memberId: 'MEM005', name: 'Vikram Reddy', email: 'vikram@gmail.com', phone: '9432109876', membershipPlan: 'Monthly', membershipStatus: 'suspended', renewDate: new Date(Date.now() + 20 * 24 * 3600000).toISOString(), attendance: 12, visits: 18, gymId: 'g1', joinedAt: '2024-05-20', createdAt: '2024-05-20', updatedAt: '2024-07-01' },
  { id: '6', memberId: 'MEM006', name: 'Ananya Kumar', email: 'ananya@gmail.com', phone: '9321098765', membershipPlan: 'Quarterly', membershipStatus: 'active', renewDate: new Date(Date.now() + 45 * 24 * 3600000).toISOString(), attendance: 88, visits: 102, gymId: 'g1', joinedAt: '2024-04-10', createdAt: '2024-04-10', updatedAt: '2024-07-14' },
  { id: '7', memberId: 'MEM007', name: 'Karthik Nair', email: 'karthik@gmail.com', phone: '9210987654', membershipPlan: 'Student', membershipStatus: 'frozen', renewDate: new Date(Date.now() + 60 * 24 * 3600000).toISOString(), attendance: 55, visits: 76, gymId: 'g1', joinedAt: '2024-02-15', createdAt: '2024-02-15', updatedAt: '2024-07-10' },
  { id: '8', memberId: 'MEM008', name: 'Divya Menon', email: 'divya@gmail.com', phone: '9109876543', membershipPlan: 'Premium', membershipStatus: 'active', renewDate: new Date(Date.now() + 22 * 24 * 3600000).toISOString(), attendance: 82, visits: 195, trainerName: 'Meera Singh', gymId: 'g1', joinedAt: '2023-11-01', createdAt: '2023-11-01', updatedAt: '2024-07-14' },
];

export function useMembers(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: ['members', params],
    queryFn: async () => {
      try {
        const res = await membersApi.getAll(params);
        const rawItems = res.data.data || [];
        const pagination = (res.data as any).meta?.pagination || {};
        
        // Map DTO fields to frontend Member layout
        const items: Member[] = rawItems.map((m: any) => ({
          id: m.id,
          memberId: m.id.substring(0, 8).toUpperCase(),
          name: m.fullName || m.name || '',
          email: m.email || '',
          phone: m.phone || '',
          membershipStatus: m.status || 'active',
          membershipPlan: m.notes?.includes('Renewed plan:') ? m.notes.replace('Renewed plan: ', '') : 'Premium',
          renewDate: m.joinedAt ? new Date(new Date(m.joinedAt).getTime() + 30 * 24 * 3600 * 1000).toISOString() : new Date().toISOString(),
          attendance: 85,
          visits: 12,
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
      } catch {
        // Return mock data
        const filtered = mockMembers.filter((m) => {
          if (params?.search) {
            const s = params.search.toLowerCase();
            if (!m.name.toLowerCase().includes(s) && !m.email.toLowerCase().includes(s) && !m.memberId.toLowerCase().includes(s)) return false;
          }
          if (params?.status && m.membershipStatus !== params.status) return false;
          return true;
        });
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 10;
        return {
          success: true,
          data: filtered.slice((page - 1) * limit, page * limit),
          total: filtered.length,
          page,
          limit,
          totalPages: Math.ceil(filtered.length / limit),
        };
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ['member', id],
    queryFn: async () => {
      try {
        const res = await membersApi.getById(id);
        const m = res.data.data as any;
        return {
          id: m.id,
          memberId: m.id.substring(0, 8).toUpperCase(),
          name: m.fullName || m.name || '',
          email: m.email || '',
          phone: m.phone || '',
          avatar: m.avatar || '',
          membershipStatus: m.status || 'active',
          membershipPlan: 'Premium',
          renewDate: m.joinedAt ? new Date(new Date(m.joinedAt).getTime() + 30 * 24 * 3600 * 1000).toISOString() : new Date().toISOString(),
          attendance: 85,
          visits: 12,
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
      } catch {
        return mockMembers.find((m) => m.id === id) || null;
      }
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
