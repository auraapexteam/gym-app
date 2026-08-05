import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { DollarSign, Users, TrendingUp, Award } from 'lucide-react';
import { useRevenueChart, useDashboardStats } from '@/hooks/useDashboard';

export default function AnalyticsPage() {
  const { data: revenueChartData = [] } = useRevenueChart('month');
  const { data: stats } = useDashboardStats();

  const chartData = Array.isArray(revenueChartData) && revenueChartData.length > 0
    ? revenueChartData
    : [
        { month: 'Current', revenue: stats?.monthlyRevenue || 0 },
      ];

  const statCards = [
    { title: 'Monthly Revenue', value: `₹${(stats?.monthlyRevenue || 0).toLocaleString()}`, icon: DollarSign, iconColor: 'text-aura-primary' },
    { title: 'Active Members', value: stats?.activeMembers || 0, icon: Users, iconColor: 'text-aura-success' },
    { title: 'Today Check-ins', value: stats?.todayCheckins || 0, icon: TrendingUp, iconColor: 'text-blue-400' },
    { title: 'Renewals Due', value: stats?.membershipRenewals || 0, icon: Award, iconColor: 'text-aura-warning' },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Analytics' }]}
    >
      <div className="mb-6">
        <h1 className="text-xl font-bold text-aura-text">Financial & Revenue Analytics</h1>
        <p className="text-sm text-aura-muted mt-0.5">Live gym revenue and member growth performance insights</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => (
          <StatCard key={s.title} {...s} index={i} />
        ))}
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        <Card>
          <CardHeader className="p-6 pb-4">
            <CardTitle>Revenue Overview</CardTitle>
            <p className="text-xs text-aura-muted mt-0.5">Live financial trajectory from database subscriptions</p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C6FF00" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#C6FF00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
                <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A1D24', borderColor: '#2A2D35', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#C6FF00" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
