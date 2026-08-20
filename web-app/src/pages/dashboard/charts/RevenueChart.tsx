import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useRevenueChart } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui';
import { useState } from 'react';

const PERIOD_OPTIONS = [
  { label: '7D', value: 'week' },
  { label: '1M', value: 'month' },
  { label: '1Y', value: 'year' },
] as const;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-aura-card border border-aura-border rounded-md p-3 shadow-aura-lg text-xs">
      <p className="text-aura-muted mb-2 font-medium">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="font-medium">
          {entry.name}: ₹{Number(entry.value).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
};

export function RevenueChart() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { data, isLoading } = useRevenueChart(period);

  const chartData = Array.isArray(data) ? data.map((d: any) => ({
    ...d,
    month: d.month || d.date || d.name || d.label || 'Month',
    year: d.year || d.date || d.name || d.label || 'Year',
    day: d.day || d.date || d.name || d.label || 'Day',
    revenue: Number(d.revenue ?? d.amount ?? d.total ?? d.value ?? 0),
    target: Number(d.target ?? d.goal ?? 0)
  })) : [];

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue vs refunds</CardTitle>
            <p className="text-xs text-aura-muted mt-0.5">Last 12 weeks</p>
          </div>
          <div className="flex items-center gap-1 bg-aura-bg border border-aura-border rounded-md p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  period === opt.value
                    ? 'bg-aura-primary text-aura-bg'
                    : 'text-aura-muted hover:text-aura-text'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C6FF00" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#C6FF00" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
              <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, color: '#9CA3AF', paddingTop: 12 }}
              />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#C6FF00" strokeWidth={2} fill="url(#revenueGrad)" dot={false} activeDot={(props: any) => <circle cx={props.cx} cy={props.cy} r={5} fill="#C6FF00" stroke="none" />} />
              <Area type="monotone" dataKey="target" name="Target" stroke="#3B82F6" strokeWidth={2} strokeDasharray="4 4" fill="url(#targetGrad)" dot={false} activeDot={(props: any) => <circle cx={props.cx} cy={props.cy} r={5} fill="#3B82F6" stroke="none" />} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
