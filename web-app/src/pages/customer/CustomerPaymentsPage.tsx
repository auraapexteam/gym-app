import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { paymentsApi } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/utils';
import { CreditCard, CheckCircle2, DollarSign } from 'lucide-react';

export default function CustomerPaymentsPage() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['customer-payments'],
    queryFn: async () => {
      const res = await paymentsApi.getAll();
      return Array.isArray(res.data.data) ? res.data.data : [];
    },
  });

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Customer Portal', href: '/dashboard' }, { label: 'My Invoices & Payments' }]}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-aura-card border border-aura-border p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-aura-text">My Invoices & Transaction Receipts</h1>
            <p className="text-sm text-aura-muted mt-1">View billing receipts and payment histories for your gym membership</p>
          </div>
          <Badge variant="info" className="gap-1 text-xs">
            <CreditCard className="h-3.5 w-3.5" /> Billing History
          </Badge>
        </div>

        <Card>
          <CardHeader className="p-6 pb-2">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-aura-primary" /> Member Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {isLoading ? (
              <div className="py-12 text-center text-aura-muted text-xs animate-pulse">
                Loading billing history...
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-10 text-aura-muted text-xs border border-dashed border-aura-border rounded-xl">
                No payment transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-aura-border text-left">
                      {['Transaction Date', 'Amount Paid', 'Payment Method', 'Status'].map((h) => (
                        <th key={h} className="pb-3 font-semibold text-aura-muted uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-aura-border">
                    {payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-white/3">
                        <td className="py-3 font-semibold text-aura-text">{formatDate(p.createdAt || p.created_at)}</td>
                        <td className="py-3 text-aura-primary font-bold text-sm">₹{p.amount}</td>
                        <td className="py-3 text-aura-muted capitalize">{p.method || 'upi'}</td>
                        <td className="py-3">
                          <Badge variant="success" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Paid
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
