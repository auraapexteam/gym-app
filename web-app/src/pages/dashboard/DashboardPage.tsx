import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { RevenueChart } from './charts/RevenueChart';
import { PeakHoursChart } from './charts/PeakHoursChart';
import { useDashboardStats } from '@/hooks/useDashboard';
import { cn, formatCurrency } from '@/utils';
import {
  ArrowUpRight,
  DollarSign,
  Users,
  UserCheck,
  TrendingUp,
} from 'lucide-react';

const planMix = [
  { label: 'Monthly', value: 42, color: 'bg-aura-primary' },
  { label: 'Annual', value: 22, color: 'bg-blue-400' },
  { label: 'Quarterly', value: 18, color: 'bg-purple-400' },
  { label: 'Elite', value: 12, color: 'bg-orange-400' },
  { label: 'Drop-in', value: 6, color: 'bg-aura-danger' },
];

const busyZones = [
  { name: 'Strength floor', active: 18, capacity: 24, note: 'Peak window · 6-8pm' },
  { name: 'Cardio deck', active: 17, capacity: 22, note: 'Treadmills trending high' },
  { name: 'Free weights', active: 28, capacity: 34, note: 'Evening crowd building' },
  { name: 'Functional zone', active: 11, capacity: 16, note: 'Trainer-supervised slots' },
  { name: 'Recovery area', active: 20, capacity: 30, note: 'Sauna and stretching usage' },
];

const renewals = [
  { initials: 'AK', name: 'Amit Kumar', plan: 'Annual', date: '2026-07-21' },
  { initials: 'DN', name: 'Deepika Nair', plan: 'Annual', date: '2026-07-23' },
  { initials: 'RJ', name: 'Rohan Joshi', plan: 'Quarterly', date: '2026-07-25' },
  { initials: 'KR', name: 'Kavya Reddy', plan: 'Monthly', date: '2026-07-29' },
  { initials: 'SK', name: 'Suresh Kumar', plan: 'Yearly', date: '2026-08-02' },
];

const latestCheckins = [
  { time: '05:00', name: 'Amit Kumar', method: 'Keycard' },
  { time: '06:07', name: 'Priya Patel', method: 'App QR' },
  { time: '07:14', name: 'Rahul Gupta', method: 'Front desk' },
  { time: '08:21', name: 'Sneha Singh', method: 'Keycard' },
  { time: '09:28', name: 'Vikram Reddy', method: 'App QR' },
  { time: '10:35', name: 'Ananya Kumar', method: 'Front desk' },
  { time: '11:42', name: 'Karthik Nair', method: 'Keycard' },
];

function MetricCard({
  title,
  value,
  caption,
  change,
  icon: Icon,
  featured,
}: {
  title: string;
  value: string | number;
  caption: string;
  change: number;
  icon: React.ElementType;
  featured?: boolean;
}) {
  return (
    <Card
      className={cn(
        'p-5 min-h-40 shadow-none',
        featured && 'bg-aura-primary text-aura-bg border-aura-primary',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={cn(
            'text-xs font-semibold uppercase tracking-wider',
            featured ? 'text-aura-bg/70' : 'text-aura-muted',
          )}>
            {title}
          </p>
          <p className={cn('mt-4 text-3xl font-extrabold', featured ? 'text-aura-bg' : 'text-aura-text')}>
            {value}
          </p>
          <p className={cn('mt-2 text-sm', featured ? 'text-aura-bg/70' : 'text-aura-muted')}>{caption}</p>
        </div>
        <div className={cn(
          'h-11 w-11 rounded-lg flex items-center justify-center',
          featured ? 'bg-aura-bg/10 text-aura-bg' : 'bg-aura-bg border border-aura-border text-aura-primary',
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className={cn(
        'mt-5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        featured ? 'bg-aura-bg/10 text-aura-bg' : 'bg-aura-primary/10 text-aura-primary',
      )}>
        <ArrowUpRight className="h-3.5 w-3.5" />
        {change}% vs last month
      </div>
    </Card>
  );
}

function PlanMixCard() {
  return (
    <Card className="h-full shadow-none">
      <CardHeader>
        <CardTitle>Plan mix</CardTitle>
        <CardDescription>24 active</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {planMix.map((plan) => (
          <div key={plan.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-aura-text">
                <span className={cn('h-2.5 w-2.5 rounded-full', plan.color)} />
                {plan.label}
              </div>
              <span className="font-semibold text-aura-text">{plan.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-aura-bg">
              <div className={cn('h-full rounded-full', plan.color)} style={{ width: `${plan.value}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function BusyZonesCard() {
  return (
    <Card className="h-full shadow-none">
      <CardHeader>
        <CardTitle>Busiest gym zones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {busyZones.map((item) => {
          const percent = Math.round((item.active / item.capacity) * 100);
          return (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-aura-text">{item.name}</p>
                <p className="text-sm text-aura-muted">{item.active}/{item.capacity}</p>
              </div>
              <div className="h-2 rounded-full bg-aura-bg">
                <div className="h-full rounded-full bg-aura-primary" style={{ width: `${percent}%` }} />
              </div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-xs text-aura-muted">{item.note}</p>
                <p className="text-xs font-semibold text-aura-primary">{percent}%</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function RenewalsCard() {
  return (
    <Card className="h-full shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Renewals due</CardTitle>
          <CardDescription>5 members expiring within 14 days</CardDescription>
        </div>
        <button className="rounded-md border border-aura-border px-3 py-1.5 text-xs font-medium text-aura-text hover:bg-white/5">
          All members
        </button>
      </CardHeader>
      <CardContent className="space-y-3">
        {renewals.map((member) => (
          <div key={member.name} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-aura-primary/10 text-xs font-bold text-aura-primary">
              {member.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-aura-text">{member.name}</p>
              <p className="truncate text-xs text-aura-muted">{member.plan} · renews {member.date}</p>
            </div>
            <button className="rounded-md bg-aura-bg px-3 py-1.5 text-xs font-medium text-aura-text hover:bg-white/5">
              Nudge
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LatestCheckinsCard() {
  return (
    <Card className="h-full shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Latest check-ins</CardTitle>
          <CardDescription>Live · 18 today</CardDescription>
        </div>
        <span className="rounded-full bg-aura-primary/10 px-2.5 py-1 text-xs font-semibold text-aura-primary">
          Realtime
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        {latestCheckins.map((entry) => (
          <div key={`${entry.time}-${entry.name}`} className="grid grid-cols-[52px_1fr_auto] items-center gap-3 text-sm">
            <span className="font-mono text-xs text-aura-muted">{entry.time}</span>
            <span className="truncate font-medium text-aura-text">{entry.name}</span>
            <span className="text-xs text-aura-muted">{entry.method}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats } = useDashboardStats();

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard' }]}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <MetricCard
          title="Monthly revenue"
          value={formatCurrency(stats?.monthlyRevenue ?? 842000)}
          caption="Recurring across all plans"
          change={stats?.revenueGrowth ?? 8.4}
          icon={DollarSign}
          featured
        />
        <MetricCard
          title="Active members"
          value={stats?.activeMembers ?? 24}
          caption="6 renewing soon"
          change={stats?.memberGrowth ?? 3.2}
          icon={Users}
        />
        <MetricCard
          title="Check-ins today"
          value={stats?.todayCheckins ?? 18}
          caption="Peak at 6-8pm"
          change={12.5}
          icon={UserCheck}
        />
        <MetricCard
          title="Floor utilization"
          value={`${stats?.classFillRate ?? 81}%`}
          caption="This week"
          change={1.4}
          icon={TrendingUp}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <PlanMixCard />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PeakHoursChart />
        </div>
        <BusyZonesCard />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RenewalsCard />
        <LatestCheckinsCard />
      </div>
    </DashboardLayout>
  );
}
