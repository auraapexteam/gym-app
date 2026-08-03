import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@/api';
import { toast } from 'sonner';
import type { Payment } from '@/types';

const mockPayments: Payment[] = [
  { id: '1', transactionId: 'TXN-2024-001', memberId: 'm1', memberName: 'Arjun Sharma', amount: 2999, type: 'membership', status: 'completed', gateway: 'razorpay', createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: '2', transactionId: 'TXN-2024-002', memberId: 'm2', memberName: 'Priya Patel', amount: 499, type: 'nutrition', status: 'completed', gateway: 'razorpay', createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: '3', transactionId: 'TXN-2024-003', memberId: 'm3', memberName: 'Rahul Gupta', amount: 4999, type: 'membership', status: 'pending', gateway: 'razorpay', createdAt: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: '4', transactionId: 'TXN-2024-004', memberId: 'm4', memberName: 'Sneha Singh', amount: 1200, type: 'class', status: 'completed', gateway: 'cash', createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
  { id: '5', transactionId: 'TXN-2024-005', memberId: 'm5', memberName: 'Vikram Reddy', amount: 2999, type: 'membership', status: 'failed', gateway: 'razorpay', createdAt: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: '6', transactionId: 'TXN-2024-006', memberId: 'm6', memberName: 'Ananya Kumar', amount: 7999, type: 'membership', status: 'completed', gateway: 'razorpay', createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: '7', transactionId: 'TXN-2024-007', memberId: 'm7', memberName: 'Karthik Nair', amount: 299, type: 'nutrition', status: 'refunded', gateway: 'razorpay', createdAt: new Date(Date.now() - 48 * 3600000).toISOString() },
];

export function usePayments(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: async () => {
      try {
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
      } catch {
        return mockPayments;
      }
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
