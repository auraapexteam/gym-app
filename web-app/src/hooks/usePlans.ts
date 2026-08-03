import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '@/api';
import { toast } from 'sonner';
import type { MembershipPlan } from '@/types';

// Fallback mock data in case database doesn't have plans seeded yet
const mockPlans: MembershipPlan[] = [
  { id: '1', name: 'Daily Pass', type: 'daily', price: 200, duration: 1, benefits: ['Single day access', 'Locker facility', 'Basic equipment'], isActive: true, gymId: 'g1', createdAt: '2024-01-01' },
  { id: '2', name: 'Weekly Plan', type: 'weekly', price: 800, duration: 7, benefits: ['7-day access', 'Locker facility', 'All equipment', 'Group classes'], isActive: true, gymId: 'g1', createdAt: '2024-01-01' },
  { id: '3', name: 'Monthly Plan', type: 'monthly', price: 2999, duration: 30, benefits: ['30-day access', 'Locker facility', 'All equipment', 'Group classes', 'Nutrition advice'], isActive: true, gymId: 'g1', createdAt: '2024-01-01' },
  { id: '4', name: 'Quarterly Plan', type: 'quarterly', price: 7999, duration: 90, benefits: ['90-day access', 'Locker facility', 'All equipment', 'Group classes', 'Personal trainer session', 'Nutrition plan'], isActive: true, gymId: 'g1', createdAt: '2024-01-01' },
  { id: '5', name: 'Yearly Plan', type: 'yearly', price: 24999, duration: 365, benefits: ['365-day access', 'Priority locker', 'All equipment', 'Unlimited classes', '4 PT sessions/month', 'Nutrition plan', 'Free merchandise'], isActive: true, gymId: 'g1', createdAt: '2024-01-01' },
];

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      try {
        const res = await plansApi.getAll();
        return res.data.data;
      } catch {
        return mockPlans;
      }
    },
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MembershipPlan>) => plansApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plan created successfully.');
    },
    onError: () => toast.error('Failed to create plan.'),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MembershipPlan> }) =>
      plansApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plan updated successfully.');
    },
    onError: () => toast.error('Failed to update plan.'),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plansApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plan deleted successfully.');
    },
    onError: () => toast.error('Failed to delete plan.'),
  });
}
