import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle, Badge, SearchInput, Pagination, StatCard } from '@/components/ui';
import { DollarSign, AlertCircle, RefreshCw, TrendingDown, Download } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/utils';
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

const statusVariantMap: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'muted'> = {
  completed: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'info',
};

const TABS = ['All', 'Completed', 'Pending', 'Failed', 'Refunded'];

export default function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [page, setPage] = useState(1);

  const filtered = mockPayments.filter((p) => {
    if (search && !p.memberName.toLowerCase().includes(search.toLowerCase()) && !p.transactionId.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab !== 'All' && p.status !== activeTab.toLowerCase()) return false;
    return true;
  });

  const totalRevenue = mockPayments.filter((p) => p.status === 'completed').reduce((a, p) => a + p.amount, 0);
  const pendingAmount = mockPayments.filter((p) => p.status === 'pending').reduce((a, p) => a + p.amount, 0);
  const refundAmount = mockPayments.filter((p) => p.status === 'refunded').reduce((a, p) => a + p.amount, 0);
  const failedCount = mockPayments.filter((p) => p.status === 'failed').length;

  const stats = [
    { title: 'Total Revenue', value: totalRevenue, isCurrency: true, icon: DollarSign, iconColor: 'text-aura-primary' },
    { title: 'Pending Amount', value: pendingAmount, isCurrency: true, icon: AlertCircle, iconColor: 'text-aura-warning' },
    { title: 'Refunded', value: refundAmount, isCurrency: true, icon: RefreshCw, iconColor: 'text-blue-400' },
    { title: 'Failed Payments', value: failedCount, icon: TrendingDown, iconColor: 'text-aura-danger' },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Payments' }]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Payments</h1>
          <p className="text-sm text-aura-muted mt-0.5">Track all transactions and revenue</p>
        </div>
        <button className="flex items-center gap-2 bg-aura-card border border-aura-border text-aura-text text-sm font-medium px-4 py-2 rounded-md hover:border-aura-primary/50 transition-colors">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <StatCard key={s.title} {...s} index={i} />
        ))}
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="p-6 pb-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-1 bg-aura-bg border border-aura-border rounded-md p-1">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setPage(1); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    activeTab === tab
                      ? 'bg-aura-primary text-aura-bg'
                      : 'text-aura-muted hover:text-aura-text'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <SearchInput value={search} onChange={setSearch} placeholder="Search transactions..." className="w-64" />
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-aura-border">
                {['Transaction ID', 'Member', 'Type', 'Amount', 'Gateway', 'Status', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-aura-muted uppercase tracking-wider first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-border">
              {filtered.map((payment) => (
                <tr key={payment.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3.5 pl-6">
                    <span className="font-mono text-xs text-aura-primary">{payment.transactionId}</span>
                  </td>
                  <td className="px-4 py-3.5 text-aura-text font-medium">{payment.memberName}</td>
                  <td className="px-4 py-3.5 capitalize text-aura-muted">{payment.type}</td>
                  <td className="px-4 py-3.5 font-semibold text-aura-text">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-3.5 capitalize text-aura-muted">{payment.gateway}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant={statusVariantMap[payment.status] ?? 'muted'} className="capitalize">
                      {payment.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-aura-muted text-xs">{formatDateTime(payment.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="py-12 text-center text-aura-muted text-sm">No payments found</div>
          )}
          {filtered.length > 0 && (
            <div className="px-4 py-4 border-t border-aura-border">
              <Pagination page={1} totalPages={1} total={filtered.length} limit={10} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
