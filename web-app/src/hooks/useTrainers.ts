import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainersApi } from '@/api';
import { toast } from 'sonner';
import type { Trainer } from '@/types';

export function useTrainers() {
  return useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      const res = await trainersApi.getAll();
      const raw = res.data.data || [];
      
      // Translate backend DTO fields
      const items: Trainer[] = raw.map((t: any) => ({
        id: t.id,
        name: t.name || t.fullName || '',
        email: t.email || '',
        phone: t.phone || '',
        specialization: Array.isArray(t.specialization) ? t.specialization : (t.specialization ? t.specialization.split(',') : ['General Trainer']),
        rating: t.rating || 4.7,
        clients: t.clients || 0,
        workingHours: t.workingHours || '8 AM – 4 PM',
        availability: t.availability !== undefined ? t.availability : true,
        salary: t.salary || 0,
        gymId: t.gymId || '',
        joinedAt: t.joinedAt || new Date().toISOString(),
      }));
      return items;
    },
  });
}

export function useCreateTrainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => trainersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trainers'] });
      toast.success('Trainer registered successfully.');
    },
    onError: () => toast.error('Failed to register trainer.'),
  });
}

export function useUpdateTrainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      trainersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trainers'] });
      toast.success('Trainer details updated.');
    },
    onError: () => toast.error('Failed to update trainer details.'),
  });
}

export function useDeleteTrainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trainersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trainers'] });
      toast.success('Trainer removed successfully.');
    },
    onError: () => toast.error('Failed to delete trainer.'),
  });
}
