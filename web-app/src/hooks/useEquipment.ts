import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentApi } from '@/api';
import { toast } from 'sonner';
import type { Equipment } from '@/types';

const mockEquipment: Equipment[] = [
  { id: '1', name: 'Treadmill #1', category: 'Cardio', condition: 'excellent', purchaseDate: '2023-01-15', warrantyExpiry: '2026-01-15', nextService: new Date(Date.now() + 30 * 24 * 3600000).toISOString(), usageHours: 1240, gymId: 'g1', serviceHistory: [] },
  { id: '2', name: 'Treadmill #2', category: 'Cardio', condition: 'good', purchaseDate: '2022-06-01', warrantyExpiry: '2025-06-01', nextService: new Date(Date.now() + 15 * 24 * 3600000).toISOString(), usageHours: 2180, gymId: 'g1', serviceHistory: [] },
  { id: '3', name: 'Treadmill #3', category: 'Cardio', condition: 'maintenance', purchaseDate: '2021-11-20', warrantyExpiry: '2024-11-20', nextService: new Date(Date.now() - 2 * 24 * 3600000).toISOString(), usageHours: 3450, gymId: 'g1', serviceHistory: [] },
  { id: '4', name: 'Elliptical #1', category: 'Cardio', condition: 'good', purchaseDate: '2023-03-10', warrantyExpiry: '2026-03-10', nextService: new Date(Date.now() + 45 * 24 * 3600000).toISOString(), usageHours: 890, gymId: 'g1', serviceHistory: [] },
  { id: '5', name: 'Bench Press Station', category: 'Strength', condition: 'excellent', purchaseDate: '2023-07-01', warrantyExpiry: '2026-07-01', nextService: new Date(Date.now() + 60 * 24 * 3600000).toISOString(), usageHours: 540, gymId: 'g1', serviceHistory: [] },
  { id: '6', name: 'Cable Machine', category: 'Strength', condition: 'fair', purchaseDate: '2021-05-15', warrantyExpiry: '2024-05-15', nextService: new Date(Date.now() + 5 * 24 * 3600000).toISOString(), usageHours: 4200, gymId: 'g1', serviceHistory: [] },
  { id: '7', name: 'Rowing Machine', category: 'Cardio', condition: 'good', purchaseDate: '2022-09-01', warrantyExpiry: '2025-09-01', nextService: new Date(Date.now() + 20 * 24 * 3600000).toISOString(), usageHours: 1680, gymId: 'g1', serviceHistory: [] },
  { id: '8', name: 'Power Rack', category: 'Strength', condition: 'excellent', purchaseDate: '2023-02-20', warrantyExpiry: '2028-02-20', nextService: new Date(Date.now() + 90 * 24 * 3600000).toISOString(), usageHours: 320, gymId: 'g1', serviceHistory: [] },
];

export function useEquipment() {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      try {
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
      } catch {
        return mockEquipment;
      }
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
