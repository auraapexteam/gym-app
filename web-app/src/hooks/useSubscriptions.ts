import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi, CreateManualSubscriptionPayload } from '@/api/subscriptions';
import { toast } from 'sonner';

export function useCreateManualSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateManualSubscriptionPayload) =>
      subscriptionsApi.createManual(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Membership plan activated for member.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to activate membership plan.';
      toast.error(msg);
    },
  });
}

export function useMySubscriptions() {
  return useQuery({
    queryKey: ['subscriptions', 'me'],
    queryFn: async () => {
      const res = await subscriptionsApi.getMine();
      return res.data.data || [];
    },
  });
}
