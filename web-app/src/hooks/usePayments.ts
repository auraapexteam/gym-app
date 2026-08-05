import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@/api';
import { toast } from 'sonner';
import type { Payment } from '@/types';

export function usePayments(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: async () => {
      const res = await paymentsApi.getAll(params);
      const raw = res.data.data || [];
      
      return raw.map((p: any) => ({
        id: p.id,
        transactionId: p.transactionId || `TXN-${p.id.substring(0, 8).toUpperCase()}`,
        memberId: p.memberId || '',
        memberName: p.memberName || p.memberFullName || 'Gym Member',
        amount: p.amount || 0,
        type: p.type || 'membership',
        status: p.status || 'completed',
        gateway: p.gateway || 'razorpay',
        createdAt: p.createdAt || new Date().toISOString(),
      }));
    },
  });
}

export function useRefundPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.refund(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Refund initiated successfully.');
    },
    onError: () => toast.error('Failed to initiate refund.'),
  });
}
