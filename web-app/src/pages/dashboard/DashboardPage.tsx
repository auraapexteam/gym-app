import { Navigate } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { StatCard, StatCardSkeleton, Card, CardContent, Badge, Button } from '@/components/ui';
import { RevenueChart } from './charts/RevenueChart';
import { AttendanceChart } from './charts/AttendanceChart';
import { MembershipGrowthChart } from './charts/MembershipGrowthChart';
import { PeakHoursChart } from './charts/PeakHoursChart';
import { RecentPaymentsTable } from './widgets/RecentPaymentsTable';
import { UpcomingRenewals } from './widgets/UpcomingRenewals';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useAuthStore } from '@/store';
import { useJoinRequestStatus, useGymDirectory } from '@/hooks/useGyms';
import { useAttendance } from '@/hooks/useAttendance';
import { formatDate } from '@/utils';
import {
  DollarSign, Users, UserCheck, RefreshCw,
  AlertCircle, TrendingUp, Dumbbell, QrCode, CheckCircle2, Clock, Activity, Building2
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (user?.role === 'super_admin') {
    return <Navigate to="/super-admin/gyms" replace />;
  }

  // Customer Dashboard View
  if (user?.role === 'customer') {
    return <CustomerDashboardView />;
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
  ];

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Dashboard' }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-aura-text">
            {getGreeting()}, {user?.name || 'Owner'} 👋
          </h1>
          <p className="text-aura-muted text-sm mt-1">Here's what's happening at your gym today.</p>
        </div>

        {isError && (
          <div className="p-4 bg-aura-danger/10 border border-aura-danger/30 rounded-lg flex items-center gap-3 text-aura-danger text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Backend Connection / API Error</p>
              <p className="text-xs opacity-90">{(error as any)?.response?.data?.message || (error as any)?.message || 'Failed to fetch owner stats.'}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            : statCards.map((card, i) => <StatCard key={card.title} {...card} index={i} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RevenueChart />
            <AttendanceChart />
          </div>
          <div className="space-y-6">
            <MembershipGrowthChart />
            <PeakHoursChart />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentPaymentsTable />
          </div>
          <div>
            <UpcomingRenewals />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function CustomerDashboardView() {
  const { user } = useAuthStore();
  const { data: joinStatus } = useJoinRequestStatus();
  const { data: gyms = [] } = useGymDirectory();
  const { data: userAttendance = [] } = useAttendance();

  const isApproved = joinStatus?.status === 'approved';
  const approvedGym = isApproved ? gyms.find((g) => g.id === joinStatus?.gymId) : null;
  const qrPassToken = `MEMBER-${user?.id?.substring(0, 8).toUpperCase() || 'PASS'}`;
  const qrPassImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPassToken)}`;

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Customer Portal', href: '/dashboard' }, { label: 'My Dashboard' }]}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Welcome Banner */}
        <div className="bg-aura-card border border-aura-border p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-aura-text">Welcome back, {user?.name}! 👋</h1>
            <p className="text-sm text-aura-muted mt-1">Your personal member fitness and check-in portal</p>
          </div>
          <Badge variant={isApproved ? 'success' : joinStatus?.status === 'pending' ? 'warning' : 'secondary'}>
            {isApproved ? 'ACTIVE MEMBER' : joinStatus?.status === 'pending' ? 'PENDING APPROVAL' : 'NO GYM LINKED'}
          </Badge>
        </div>

        {/* Member Digital QR Pass & Active Membership Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 border-aura-primary/40">
            <CardContent className="p-6 text-center flex flex-col items-center">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="h-5 w-5 text-aura-primary" />
                <h3 className="font-bold text-aura-text text-sm uppercase tracking-wider">Digital Check-in Pass</h3>
              </div>

              <div className="bg-white p-4 rounded-2xl border-2 border-aura-primary/30 shadow-aura-md my-2">
                <img src={qrPassImageUrl} alt="Member QR Pass" className="h-44 w-44 object-contain rounded" />
              </div>

              <p className="text-xs text-aura-muted mt-2">Scan at gym reception for instant check-in</p>
              <p className="font-mono text-xs font-bold text-aura-primary bg-aura-primary/10 border border-aura-primary/20 px-3 py-1 rounded mt-2">
                {qrPassToken}
              </p>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-aura-card border border-aura-border rounded-xl p-5">
                <p className="text-xs text-aura-muted mb-1">Linked Fitness Center</p>
                <p className="text-base font-bold text-aura-text">{approvedGym?.name || joinStatus?.gymName || 'Iron Paradise Gym'}</p>
                <p className="text-xs text-aura-success mt-1 font-semibold">Active Member Access</p>
              </div>

              <div className="bg-aura-card border border-aura-border rounded-xl p-5">
                <p className="text-xs text-aura-muted mb-1">Total Recorded Visits</p>
                <p className="text-2xl font-extrabold text-aura-primary">{userAttendance.length}</p>
                <p className="text-xs text-aura-muted mt-1">Gym check-ins</p>
              </div>
            </div>

            {/* Attendance Timeline */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-aura-text text-sm mb-3 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-aura-primary" /> Recent Gym Attendance Logs
                </h3>
                {userAttendance.length === 0 ? (
                  <div className="text-center py-8 text-aura-muted text-xs border border-dashed border-aura-border rounded-xl">
                    No check-in logs recorded yet. Present your digital QR pass at reception when visiting the gym!
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-aura-border text-left">
                        <th className="pb-2 font-semibold text-aura-muted">Date & Time</th>
                        <th className="pb-2 font-semibold text-aura-muted">Method</th>
                        <th className="pb-2 font-semibold text-aura-muted">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-aura-border">
                      {userAttendance.slice(0, 5).map((a: any) => (
                        <tr key={a.id} className="hover:bg-white/3">
                          <td className="py-2.5 text-aura-text font-medium">{formatDate(a.checkInTime || a.created_at)}</td>
                          <td className="py-2.5 uppercase font-mono text-aura-muted">{a.method || 'qr'}</td>
                          <td className="py-2.5">
                            <Badge variant="success">Checked In</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
