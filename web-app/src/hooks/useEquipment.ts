import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentApi } from '@/api';
import { toast } from 'sonner';
import type { Equipment } from '@/types';

export function useEquipment() {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const res = await equipmentApi.getAll();
      const raw = res.data.data || [];
      
      const items: Equipment[] = raw.map((e: any) => ({
        id: e.id,
        name: e.name || '',
        category: e.category || 'General',
        condition: e.condition || 'excellent',
        purchaseDate: e.purchaseDate || new Date().toISOString(),
        warrantyExpiry: e.warrantyExpiry || new Date().toISOString(),
        nextService: e.nextService || new Date().toISOString(),
        usageHours: e.usageHours || 0,
        gymId: e.gymId || '',
        serviceHistory: e.serviceHistory || [],
      }));
      return items;
    },
  });
}

export function useCreateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => equipmentApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment registered.');
    },
    onError: () => toast.error('Failed to register equipment.'),
  });
}

export function useUpdateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      equipmentApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment status updated.');
    },
    onError: () => toast.error('Failed to update equipment details.'),
  });
}

export function useDeleteEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => equipmentApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment record removed.');
    },
    onError: () => toast.error('Failed to remove equipment record.'),
  });
}
