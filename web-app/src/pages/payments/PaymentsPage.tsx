import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, CardHeader, Badge, SearchInput, Pagination, StatCard, Modal } from '@/components/ui';
import { DollarSign, AlertCircle, RefreshCw, TrendingDown, Download, FileText, CheckCircle2, ShieldCheck, Printer, X, Building2 } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/utils';
import type { Payment } from '@/types';
import { usePayments } from '@/hooks/usePayments';

const statusVariantMap: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'muted'> = {
  completed: 'success',
  success: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'info',
};

const TABS = ['All', 'Completed', 'Pending', 'Failed', 'Refunded'];

export default function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const { data: payments = [], isLoading } = usePayments();

  const filtered = payments.filter((p) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !search ||
      p.memberName.toLowerCase().includes(query) ||
      p.transactionId.toLowerCase().includes(query) ||
      (p.memberEmail && p.memberEmail.toLowerCase().includes(query)) ||
      (p.planName && p.planName.toLowerCase().includes(query));

    if (!matchesSearch) return false;
    if (activeTab === 'Completed') return p.status === 'completed' || p.status === 'success';
    if (activeTab !== 'All' && p.status !== activeTab.toLowerCase()) return false;
    return true;
  });

  const totalRevenue = payments
    .filter((p) => p.status === 'completed' || p.status === 'success')
    .reduce((a, p) => a + Number(p.amount || 0), 0);

  const pendingAmount = payments
    .filter((p) => p.status === 'pending')
    .reduce((a, p) => a + Number(p.amount || 0), 0);

  const refundAmount = payments
    .filter((p) => p.status === 'refunded')
    .reduce((a, p) => a + Number(p.amount || 0), 0);

  const failedCount = payments.filter((p) => p.status === 'failed').length;

  const stats = [
    { title: 'Total Revenue', value: totalRevenue, isCurrency: true, icon: DollarSign, iconColor: 'text-aura-primary' },
    { title: 'Pending Amount', value: pendingAmount, isCurrency: true, icon: AlertCircle, iconColor: 'text-aura-warning' },
    { title: 'Refunded', value: refundAmount, isCurrency: true, icon: RefreshCw, iconColor: 'text-blue-400' },
    { title: 'Failed Payments', value: failedCount, icon: TrendingDown, iconColor: 'text-aura-danger' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Payments' }]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Payments & Billing</h1>
          <p className="text-sm text-aura-muted mt-0.5">Track all live transactions, revenue, and customer invoices</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 bg-aura-card border border-aura-border text-aura-text text-sm font-medium h-10 w-10 min-[560px]:h-auto min-[560px]:w-auto min-[560px]:px-4 min-[560px]:py-2 rounded-md hover:border-aura-primary/50 transition-colors shrink-0"
        >
          <Download className="h-5 w-5 min-[560px]:h-4 min-[560px]:w-4" /> <span className="hidden min-[560px]:inline">Export Report</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <StatCard key={s.title} {...s} index={i} />
        ))}
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="p-6 pb-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-1 bg-aura-bg border border-aura-border rounded-md p-1 overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setPage(1); }}
                  className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    activeTab === tab
                      ? 'bg-aura-primary text-aura-bg font-bold'
                      : 'text-aura-muted hover:text-aura-text'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by customer, plan, TXN ID..." className="w-full sm:w-72" />
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[850px]">
              <thead>
                <tr className="border-t border-aura-border">
                  {['Transaction ID', 'Customer / Member', 'Plan / Package', 'Amount', 'Gateway', 'Status', 'Date', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-aura-muted uppercase tracking-wider first:pl-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-aura-border">
                {filtered.map((payment) => (
                  <tr
                    key={payment.id}
                    onClick={() => setSelectedPayment(payment)}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3.5 pl-6">
                      <span className="font-mono text-xs text-aura-primary font-medium">{payment.transactionId}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-aura-text">{payment.memberName}</div>
                      {payment.memberEmail && (
                        <div className="text-xs text-aura-muted">{payment.memberEmail}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-aura-text font-medium">
                      {payment.planName || 'Membership Plan'}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-aura-text">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-3.5 capitalize text-aura-muted">{payment.gateway}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={statusVariantMap[payment.status] ?? 'muted'} className="capitalize">
                        {payment.status === 'completed' || payment.status === 'success' ? 'Success' : payment.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-aura-muted text-xs">{formatDateTime(payment.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayment(payment);
                        }}
                        className="flex items-center gap-1.5 text-xs text-aura-primary bg-aura-primary/10 hover:bg-aura-primary/20 px-2.5 py-1.5 rounded font-medium transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" /> Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isLoading && !filtered.length && (
            <div className="py-12 text-center text-aura-muted text-sm">No transactions found</div>
          )}

          {filtered.length > 0 && (
            <div className="px-4 py-4 border-t border-aura-border">
              <Pagination page={page} totalPages={Math.ceil(filtered.length / 10) || 1} total={filtered.length} limit={10} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax Invoice Slip Modal */}
      {selectedPayment && (
        <Modal
          open={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title="Tax Invoice & Receipt"
          size="md"
        >
          {(() => {
            const total = Number(selectedPayment.amount || 0);
            const base = Math.round((total / 1.18) * 100) / 100;
            const gst = Math.round((total - base) * 100) / 100;

            return (
              <div className="space-y-5 text-aura-text">
                {/* Header Banner */}
                <div className="bg-aura-card border border-aura-border rounded-xl p-5 text-center relative overflow-hidden">
                  <div className="flex justify-center items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-aura-primary" />
                    <span className="text-sm font-bold tracking-wide uppercase text-aura-muted">Apex Fitness Center</span>
                  </div>
                  <div className="text-3xl font-black text-aura-text mb-1">
                    {formatCurrency(total)}
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> PAYMENT VERIFIED & SETTLED
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-aura-border">
                    <span className="text-aura-muted">Invoice Reference</span>
                    <span className="font-mono font-bold text-aura-primary">INV-{selectedPayment.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-aura-border">
                    <span className="text-aura-muted">Razorpay Payment ID</span>
                    <span className="font-mono font-medium text-aura-text">{selectedPayment.transactionId}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-aura-border">
                    <span className="text-aura-muted">Customer Name</span>
                    <span className="font-semibold text-aura-text">{selectedPayment.memberName}</span>
                  </div>
                  {selectedPayment.memberEmail && (
                    <div className="flex justify-between py-1.5 border-b border-aura-border">
                      <span className="text-aura-muted">Customer Email</span>
                      <span className="text-aura-text">{selectedPayment.memberEmail}</span>
                    </div>
                  )}
                  {selectedPayment.memberPhone && (
                    <div className="flex justify-between py-1.5 border-b border-aura-border">
                      <span className="text-aura-muted">Contact Phone</span>
                      <span className="text-aura-text">{selectedPayment.memberPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 border-b border-aura-border">
                    <span className="text-aura-muted">Purchased Plan</span>
                    <span className="font-semibold text-aura-primary">{selectedPayment.planName || 'Membership Plan'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-aura-border">
                    <span className="text-aura-muted">Transaction Timestamp</span>
                    <span className="text-aura-text">{formatDateTime(selectedPayment.createdAt)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-aura-border">
                    <span className="text-aura-muted">Payment Channel</span>
                    <span className="capitalize font-medium text-aura-text">{selectedPayment.gateway} (Secured)</span>
                  </div>
                </div>

                {/* Tax Breakdown Table */}
                <div className="bg-aura-bg border border-aura-border rounded-lg p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between text-aura-muted">
                    <span>Base Membership Fee</span>
                    <span>₹{base.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-aura-muted">
                    <span>GST (18% Goods & Services Tax)</span>
                    <span>₹{gst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-aura-border font-bold text-sm text-aura-text">
                    <span>Total Amount Paid</span>
                    <span className="text-aura-primary">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handlePrint}
                    className="flex-1 flex items-center justify-center gap-2 bg-aura-primary text-aura-bg py-2.5 rounded-lg text-xs font-bold hover:bg-aura-primary/90 transition-colors"
                  >
                    <Printer className="w-4 h-4" /> Print / Save PDF Invoice
                  </button>
                  <button
                    onClick={() => setSelectedPayment(null)}
                    className="px-4 py-2.5 bg-aura-card border border-aura-border text-aura-muted text-xs font-medium rounded-lg hover:text-aura-text transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </DashboardLayout>
  );
}
