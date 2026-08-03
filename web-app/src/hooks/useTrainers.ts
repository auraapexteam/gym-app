import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainersApi } from '@/api';
import { toast } from 'sonner';
import type { Trainer } from '@/types';

const mockTrainers: Trainer[] = [
  { id: '1', name: 'Raj Kumar', email: 'raj@gym.com', phone: '9876543210', specialization: ['Strength Training', 'HIIT', 'CrossFit'], rating: 4.9, clients: 28, workingHours: '6 AM – 2 PM', availability: true, salary: 45000, gymId: 'g1', joinedAt: '2022-03-01' },
  { id: '2', name: 'Meera Singh', email: 'meera@gym.com', phone: '9765432109', specialization: ['Yoga', 'Pilates', 'Flexibility'], rating: 4.8, clients: 22, workingHours: '8 AM – 4 PM', availability: true, salary: 40000, gymId: 'g1', joinedAt: '2022-06-15' },
  { id: '3', name: 'Arjun Das', email: 'arjun.d@gym.com', phone: '9654321098', specialization: ['Bodybuilding', 'Nutrition', 'Weight Loss'], rating: 4.7, clients: 35, workingHours: '2 PM – 10 PM', availability: false, salary: 50000, gymId: 'g1', joinedAt: '2021-11-01' },
  { id: '4', name: 'Kavya Nair', email: 'kavya@gym.com', phone: '9543210987', specialization: ['Cardio', 'Dance Fitness', 'Zumba'], rating: 4.6, clients: 18, workingHours: '6 AM – 2 PM', availability: true, salary: 38000, gymId: 'g1', joinedAt: '2023-01-10' },
  { id: '5', name: 'Vikram Patel', email: 'vikram.p@gym.com', phone: '9432109876', specialization: ['MMA', 'Boxing', 'Combat Sports'], rating: 4.8, clients: 20, workingHours: '4 PM – 10 PM', availability: true, salary: 48000, gymId: 'g1', joinedAt: '2022-08-20' },
  { id: '6', name: 'Divya Reddy', email: 'divya.r@gym.com', phone: '9321098765', specialization: ['Sports Nutrition', 'Weight Management'], rating: 4.5, clients: 15, workingHours: '10 AM – 6 PM', availability: false, salary: 42000, gymId: 'g1', joinedAt: '2023-04-05' },
];

export function useTrainers() {
  return useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      try {
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
          clients: t.clients || 10,
          workingHours: t.workingHours || '8 AM – 4 PM',
          availability: t.availability !== undefined ? t.availability : true,
          salary: t.salary || 30000,
          gymId: t.gymId || '',
          joinedAt: t.joinedAt || new Date().toISOString(),
        }));
        return items;
      } catch {
        return mockTrainers;
      }
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
