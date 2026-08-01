import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const revenueData = [
  { month: 'Jan', memberships: 520000, nutrition: 82000, training: 38000 },
  { month: 'Feb', memberships: 580000, nutrition: 95000, training: 45000 },
  { month: 'Mar', memberships: 560000, nutrition: 88000, training: 42000 },
  { month: 'Apr', memberships: 620000, nutrition: 102000, training: 48000 },
  { month: 'May', memberships: 680000, nutrition: 110000, training: 52000 },
  { month: 'Jun', memberships: 650000, nutrition: 105000, training: 50000 },
  { month: 'Jul', memberships: 690000, nutrition: 118000, training: 56000 },
];

const retentionData = [
  { month: 'Jan', rate: 88 },
  { month: 'Feb', rate: 85 },
  { month: 'Mar', rate: 87 },
  { month: 'Apr', rate: 89 },
  { month: 'May', rate: 91 },
  { month: 'Jun', rate: 90 },
  { month: 'Jul', rate: 93 },
];

const planDistribution = [
  { name: 'Monthly', value: 42, color: '#C6FF00' },
  { name: 'Quarterly', value: 22, color: '#3B82F6' },
  { name: 'Yearly', value: 18, color: '#8B5CF6' },
  { name: 'Premium', value: 12, color: '#F97316' },
  { name: 'VIP', value: 6, color: '#EF4444' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-aura-card border border-aura-border rounded-md p-3 shadow-aura-lg text-xs">
      <p className="text-aura-muted mb-2 font-medium">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="font-medium capitalize">
          {entry.name}: {typeof entry.value === 'number' && entry.value > 1000 ? `₹${(entry.value / 1000).toFixed(0)}k` : entry.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Analytics' }]}
    >
      <div className="mb-6">
        <h1 className="text-xl font-bold text-aura-text">Analytics</h1>
        <p className="text-sm text-aura-muted mt-0.5">In-depth performance insights</p>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <CardHeader className="p-6 pb-4">
            <CardTitle>Revenue Breakdown</CardTitle>
            <p className="text-xs text-aura-muted mt-0.5">Memberships, nutrition and personal training revenue</p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  {[
                    { id: 'memGrad', color: '#C6FF00' },
                    { id: 'nutGrad', color: '#3B82F6' },
                    { id: 'clsGrad', color: '#F97316' },
                  ].map((g) => (
                    <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={g.color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={g.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
                <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#9CA3AF', paddingTop: 12 }} />
                <Area type="monotone" dataKey="memberships" name="Memberships" stroke="#C6FF00" strokeWidth={2} fill="url(#memGrad)" dot={false} />
                <Area type="monotone" dataKey="nutrition" name="Nutrition" stroke="#3B82F6" strokeWidth={2} fill="url(#nutGrad)" dot={false} />
                <Area type="monotone" dataKey="training" name="Training" stroke="#F97316" strokeWidth={2} fill="url(#clsGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader className="p-6 pb-4">
            <CardTitle>Plan Distribution</CardTitle>
            <p className="text-xs text-aura-muted mt-0.5">Active members by plan type</p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {planDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, '']} contentStyle={{ background: '#1B1D22', border: '1px solid #2A2D35', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {planDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-aura-muted">{item.name}</span>
                  <span className="text-aura-text font-medium ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retention Rate */}
      <Card>
        <CardHeader className="p-6 pb-4">
          <CardTitle>Member Retention Rate</CardTitle>
          <p className="text-xs text-aura-muted mt-0.5">Monthly retention percentage</p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={retentionData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
              <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[70, 100]} stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => [`${v}%`, 'Retention Rate']} contentStyle={{ background: '#1B1D22', border: '1px solid #2A2D35', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="rate" name="Retention" fill="#C6FF00" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
