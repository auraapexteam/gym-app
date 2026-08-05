import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, OnboardGymPayload } from '@/api/admin';
import { toast } from 'sonner';

export interface AdminGym {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'expired' | 'suspended' | 'pending';
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  lat: number;
  lng: number;
  totalMembers: number;
  activeMembers: number;
  monthlyRevenue: number;
}

export interface AdminOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
  gyms: string[];
  status: 'active' | 'suspended';
  createdAt: string;
}

export function useAdminGyms() {
  return useQuery({
    queryKey: ['admin-gyms'],
    queryFn: async () => {
      const res = await adminApi.listGyms();
      const rawGyms = Array.isArray(res.data.data) ? res.data.data : [];

      const items: AdminGym[] = rawGyms.map((g: any) => ({
        id: g.id || '',
        name: g.name || 'Apex Fitness Center',
        slug: g.slug || '',
        email: g.email || '',
        phone: g.phone || '',
        address: g.address || 'Koramangala, Bengaluru',
        status: (g.status as any) || 'active',
        ownerId: g.ownerId || g.owner_id || '',
        ownerName: g.ownerName || g.owner?.fullName || 'Gym Owner Jack',
        ownerEmail: g.email || '',
        createdAt: g.createdAt || g.created_at || new Date().toISOString().split('T')[0],
        lat: 12.9716,
        lng: 77.5946,
        totalMembers: g.totalMembers || 0,
        activeMembers: g.activeMembers || 0,
        monthlyRevenue: g.monthlyRevenue || 0,
      }));

      return items;
    },
  });
}

export function useAdminOwners() {
  return useQuery({
    queryKey: ['admin-owners'],
    queryFn: async () => {
      const res = await adminApi.listGyms();
      const rawGyms = Array.isArray(res.data.data) ? res.data.data : [];

      const ownersMap = new Map<string, AdminOwner>();

      rawGyms.forEach((g: any) => {
        const ownerId = g.ownerId || g.owner_id || g.id;
        const ownerEmail = g.email || 'owner@aura-apex.com';
        const ownerName = g.ownerName || g.owner?.fullName || 'Gym Owner Jack';

        if (!ownersMap.has(ownerId)) {
          ownersMap.set(ownerId, {
            id: ownerId,
            name: ownerName,
            email: ownerEmail,
            phone: g.phone || '9876543210',
            gyms: [g.id],
            status: g.status === 'suspended' ? 'suspended' : 'active',
            createdAt: g.createdAt || g.created_at || new Date().toISOString().split('T')[0],
          });
        } else {
          const existing = ownersMap.get(ownerId)!;
          if (!existing.gyms.includes(g.id)) {
            existing.gyms.push(g.id);
          }
        }
      });

      return Array.from(ownersMap.values());
    },
  });
}

export function useOnboardGym() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OnboardGymPayload) => adminApi.onboardGym(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-gyms'] });
      qc.invalidateQueries({ queryKey: ['admin-owners'] });
      toast.success('Gym and owner onboarded successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to onboard gym.';
      toast.error(msg);
    },
  });
}

export function useUpdateGymStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'suspended' | 'approve' }) => {
      if (status === 'suspended') return adminApi.suspendGym(id);
      if (status === 'approve') return adminApi.approveGym(id);
      return adminApi.activateGym(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-gyms'] });
      qc.invalidateQueries({ queryKey: ['admin-owners'] });
      toast.success('Gym status updated successfully.');
    },
    onError: () => toast.error('Failed to update gym status.'),
  });
}
