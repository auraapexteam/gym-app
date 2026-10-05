import { accountQueryKey } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qrApi } from '@/api/qr';
import { toast } from 'sonner';

export function useActiveQr() {
  return useQuery({
    queryKey: accountQueryKey(['active-qr']),
    queryFn: async () => {
      try {
        const res = await qrApi.getActive();
        return res.data.data;
      } catch {
        return null;
      }
    },
    refetchInterval: 30000, // auto refetch every 30 seconds
  });
}

export function useGenerateQr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (label?: string) => qrApi.generate(label),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-qr'] });
      toast.success('New daily QR code generated successfully.');
    },
    onError: () => toast.error('Failed to generate daily QR code.'),
  });
}
