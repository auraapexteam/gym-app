import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '@/api';
import { toast } from 'sonner';
import type { MembershipPlan } from '@/types';

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await plansApi.getAll();
      return res.data.data;
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
