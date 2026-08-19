import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { useRecentPayments } from '@/hooks/useDashboard';
import { formatCurrency, formatRelativeTime } from '@/utils';
import { PAYMENT_STATUS_COLORS } from '@/constants';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function RecentPaymentsTable() {
  const { data: payments, isLoading } = useRecentPayments();

  const statusVariant = (status: string) => {
    if (status === 'completed') return 'success';
    if (status === 'pending') return 'warning';
    if (status === 'failed') return 'danger';
    return 'muted';
  };

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Payments</CardTitle>
          <Link
            to="/payments"
            className="text-xs text-aura-primary hover:underline flex items-center gap-1 outline-none focus:outline-none"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-aura-border">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3">
                  <div className="h-8 w-8 rounded-full bg-white/5 animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
                    <div className="h-2.5 w-20 bg-white/5 rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
                </div>
              ))
            : payments?.map((payment) => (
                <div key={payment.id} className="flex items-center gap-4 px-6 py-3 hover:bg-white/3 transition-colors">
                  <div className="h-9 w-9 rounded-full bg-aura-primary/10 flex items-center justify-center text-xs font-bold text-aura-primary shrink-0">
                    {payment.memberName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-aura-text">{payment.memberName}</p>
                    <p className="text-xs text-aura-muted capitalize">
                      {payment.type} · {formatRelativeTime(payment.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-aura-text">
                      {formatCurrency(payment.amount)}
                    </p>
                    <Badge variant={statusVariant(payment.status) as any} className="mt-0.5 capitalize">
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}
