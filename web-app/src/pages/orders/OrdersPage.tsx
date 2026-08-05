import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle, Badge, SearchInput, Pagination, StatCard } from '@/components/ui';
import { ShoppingBag, Clock, CheckCircle, XCircle, Download } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/utils';
import type { Order } from '@/types';

const statusVariantMap: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'muted'> = {
  pending: 'warning',
  processing: 'info',
  delivered: 'success',
  cancelled: 'danger',
  refunded: 'muted',
};

const TABS = ['All', 'Pending', 'Processing', 'Delivered', 'Cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const filtered = orders.filter((o) => {
    if (search && !o.memberName.toLowerCase().includes(search.toLowerCase()) && !o.orderId.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab !== 'All' && o.status !== activeTab.toLowerCase()) return false;
    return true;
  });

  const stats = [
    { title: 'Total Orders', value: orders.length, icon: ShoppingBag, iconColor: 'text-aura-primary' },
    { title: 'Pending', value: orders.filter((o) => o.status === 'pending').length, icon: Clock, iconColor: 'text-aura-warning' },
    { title: 'Delivered', value: orders.filter((o) => o.status === 'delivered').length, icon: CheckCircle, iconColor: 'text-aura-success' },
    { title: 'Cancelled', value: orders.filter((o) => o.status === 'cancelled').length, icon: XCircle, iconColor: 'text-aura-danger' },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Orders' }]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Orders</h1>
          <p className="text-sm text-aura-muted mt-0.5">Manage nutrition store orders</p>
        </div>
        <button className="flex items-center gap-2 bg-aura-card border border-aura-border text-aura-text text-sm font-medium px-4 py-2 rounded-md hover:border-aura-primary/50 transition-colors">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatCard key={s.title} {...s} index={i} />)}
      </div>

      <Card>
        <CardHeader className="p-6 pb-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-1 bg-aura-bg border border-aura-border rounded-md p-1">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    activeTab === tab ? 'bg-aura-primary text-aura-bg' : 'text-aura-muted hover:text-aura-text'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <SearchInput value={search} onChange={setSearch} placeholder="Search orders..." className="w-64" />
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-aura-border">
                {['Order ID', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-aura-muted uppercase tracking-wider first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-border">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3.5 pl-6">
                    <span className="font-mono text-xs text-aura-primary">{order.orderId}</span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-aura-text">{order.memberName}</td>
                  <td className="px-4 py-3.5 text-aura-muted text-xs">
                    {order.items.map((i) => i.productName).join(', ')}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-aura-text">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant={statusVariantMap[order.paymentStatus] ?? 'muted'} className="capitalize">
                      {order.paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={statusVariantMap[order.status] ?? 'muted'} className="capitalize">
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-aura-muted text-xs">{formatDateTime(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="py-12 text-center text-aura-muted text-sm">No orders found</div>
          )}
          {filtered.length > 0 && (
            <div className="px-4 py-4 border-t border-aura-border">
              <Pagination page={1} totalPages={1} total={filtered.length} limit={10} onPageChange={() => {}} />
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
