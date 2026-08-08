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
        transactionId: p.razorpayPaymentId || p.razorpayOrderId || p.transactionId || `TXN-${p.id.substring(0, 8).toUpperCase()}`,
        memberId: p.memberId || '',
        memberName: p.memberName || p.memberFullName || 'Gym Customer',
        memberEmail: p.memberEmail || null,
        memberPhone: p.memberPhone || null,
        planName: p.planName || 'Membership Plan',
        amount: Number(p.amount) || 0,
        type: p.type || 'membership',
        status: p.status === 'success' ? 'completed' : p.status,
        gateway: p.method || p.gateway || 'razorpay',
        createdAt: p.paidAt || p.createdAt || new Date().toISOString(),
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
