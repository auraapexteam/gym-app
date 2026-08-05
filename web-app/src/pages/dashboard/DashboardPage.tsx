import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts';
import { StatCard, StatCardSkeleton } from '@/components/ui';
import { RevenueChart } from './charts/RevenueChart';
import { AttendanceChart } from './charts/AttendanceChart';
import { MembershipGrowthChart } from './charts/MembershipGrowthChart';
import { PeakHoursChart } from './charts/PeakHoursChart';
import { RecentPaymentsTable } from './widgets/RecentPaymentsTable';
import { UpcomingRenewals } from './widgets/UpcomingRenewals';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useAuthStore } from '@/store';
import {
  DollarSign, Users, UserCheck, RefreshCw,
  AlertCircle, TrendingUp, ShoppingBag, Dumbbell,
} from 'lucide-react';
import { formatCurrency } from '@/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (user?.role === 'super_admin') {
    return <Navigate to="/super-admin/gyms" replace />;
  }

  const { data: stats, isLoading, isError, error } = useDashboardStats();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = [
    {
      title: 'Monthly Revenue',
      value: stats?.monthlyRevenue ?? 0,
      change: stats?.revenueGrowth,
      icon: DollarSign,
      iconColor: 'text-aura-primary',
      isCurrency: true,
    },
    {
      title: 'Active Members',
      value: stats?.activeMembers ?? 0,
      change: stats?.memberGrowth,
      icon: Users,
      iconColor: 'text-blue-400',
    },
    {
      title: "Today's Check-ins",
      value: stats?.todayCheckins ?? 0,
      icon: UserCheck,
      iconColor: 'text-aura-success',
    },
    {
      title: 'Membership Renewals',
      value: stats?.membershipRenewals ?? 0,
      icon: RefreshCw,
      iconColor: 'text-aura-warning',
    },
    {
      title: 'Pending Payments',
      value: stats?.pendingPayments ?? 0,
      icon: AlertCircle,
      iconColor: 'text-aura-danger',
      isCurrency: true,
    },
    {
      title: 'Class Fill Rate',
      value: `${stats?.classFillRate ?? 0}%`,
      icon: TrendingUp,
      iconColor: 'text-purple-400',
    },
    {
      title: 'Nutrition Orders',
      value: stats?.nutritionOrders ?? 0,
      icon: ShoppingBag,
      iconColor: 'text-orange-400',
    },
    {
      title: 'Revenue Growth',
      value: `${stats?.revenueGrowth ?? 0}%`,
      change: stats?.revenueGrowth,
      icon: Dumbbell,
      iconColor: 'text-aura-primary',
    },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard' }]}
    >
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-aura-text">
          {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-aura-muted mt-1">
          Here's what's happening at your gym today.
        </p>
      </div>

      {isError && (
        <div className="mb-6 p-4 rounded-lg bg-aura-danger/10 border border-aura-danger/20 flex items-center gap-3 text-aura-danger text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Backend Connection / API Error</p>
            <p className="text-xs text-aura-danger/80">
              {(error as any)?.response?.data?.message || (error as any)?.message || 'Failed to fetch live stats from backend API.'}
            </p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((card, i) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.isCurrency && typeof card.value === 'number'
                  ? formatCurrency(card.value)
                  : card.value}
                change={card.change}
                icon={card.icon}
                iconColor={card.iconColor}
                index={i}
              />
            ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <AttendanceChart />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <MembershipGrowthChart />
        </div>
        <div>
          <PeakHoursChart />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentPaymentsTable />
        </div>
        <div>
          <UpcomingRenewals />
        </div>
      </div>
    </DashboardLayout>
  );
}
