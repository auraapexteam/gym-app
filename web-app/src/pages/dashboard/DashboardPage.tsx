import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts';
import { StatCard, StatCardSkeleton, Card, CardContent, Badge, Button, Modal } from '@/components/ui';
import { RevenueChart } from './charts/RevenueChart';
import { AttendanceChart } from './charts/AttendanceChart';
import { MembershipGrowthChart } from './charts/MembershipGrowthChart';
import { PeakHoursChart } from './charts/PeakHoursChart';
import { RecentPaymentsTable } from './widgets/RecentPaymentsTable';
import { UpcomingRenewals } from './widgets/UpcomingRenewals';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useAuthStore } from '@/store';
import { useJoinRequestStatus, useGymDirectory } from '@/hooks/useGyms';
import { useAttendance, useQrCheckIn } from '@/hooks/useAttendance';
import { useMySubscriptions } from '@/hooks/useSubscriptions';
import { formatDate } from '@/utils';
import {
  DollarSign, Users, UserCheck, RefreshCw,
  AlertCircle, TrendingUp, Dumbbell, QrCode, CheckCircle2, Clock, Activity, Building2, Zap, LogIn
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
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: joinStatus } = useJoinRequestStatus();
  const { data: gyms = [] } = useGymDirectory();
  const { data: userAttendance = [] } = useAttendance();
  const { data: mySubscriptions = [] } = useMySubscriptions();
  const qrCheckInMutation = useQrCheckIn();

  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannedQrCode, setScannedQrCode] = useState('');

  const isApproved = joinStatus?.status === 'approved';
  const approvedGym = isApproved ? (gyms || []).find((g: any) => g.id === joinStatus?.gymId) : null;

  const activeSub = (mySubscriptions || []).find((s: any) => s.status === 'active');
  const subEndDate = activeSub?.end_date || activeSub?.endDate;
  const remSubDays = subEndDate ? Math.max(0, Math.ceil((new Date(subEndDate).getTime() - Date.now()) / (1000 * 3600 * 24))) : 0;
  const totSubDays = activeSub?.plan?.duration_days || activeSub?.plan?.durationDays || 30;
  const subProgress = Math.min(100, Math.max(0, Math.round((remSubDays / totSubDays) * 100)));

  // Check if checked in today
  const todayDateStr = new Date().toISOString().split('T')[0];
  const checkedInToday = userAttendance.some((a: any) => {
    const time = a.checkInTime || a.created_at || '';
    return time.startsWith(todayDateStr);
  });

  const handleScanCheckin = () => {
    if (!scannedQrCode) return;
    qrCheckInMutation.mutate(scannedQrCode, {
      onSuccess: () => {
        setShowScannerModal(false);
        setScannedQrCode('');
      },
    });
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Customer Portal', href: '/dashboard' }, { label: 'My Dashboard' }]}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Welcome Header Banner */}
        <div className="bg-aura-card border border-aura-border p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-aura-text">Welcome back, {user?.name}! 👋</h1>
            <p className="text-sm text-aura-muted mt-1">Your personal member fitness and check-in portal</p>
          </div>
          <Badge variant={isApproved ? 'success' : joinStatus?.status === 'pending' ? 'warning' : 'muted'}>
            {isApproved ? 'ACTIVE MEMBER' : joinStatus?.status === 'pending' ? 'PENDING APPROVAL' : 'NO GYM LINKED'}
          </Badge>
        </div>

        {/* Scan Reception QR Check-in Action Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 border-aura-primary/40">
            <CardContent className="p-6 text-center flex flex-col items-center justify-between h-full space-y-4">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-aura-primary" />
                <h3 className="font-bold text-aura-text text-sm uppercase tracking-wider">Gym Check-in</h3>
              </div>

              <div className="my-2 p-4 bg-aura-primary/10 border border-aura-primary/30 rounded-2xl w-full flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-aura-primary flex items-center justify-center text-aura-bg mb-2 shadow-aura-md">
                  <UserCheck className="h-8 w-8" />
                </div>
                <Badge variant={checkedInToday ? 'success' : 'warning'} className="text-xs">
                  {checkedInToday ? 'CHECKED IN TODAY' : 'NOT CHECKED IN YET'}
                </Badge>
              </div>

              <Button
                variant="primary"
                onClick={() => setShowScannerModal(true)}
                className="w-full gap-2 text-xs font-semibold py-3"
              >
                <QrCode className="h-4 w-4" /> Scan Reception QR Code
              </Button>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-aura-card border border-aura-border rounded-xl p-4">
                <p className="text-xs text-aura-muted mb-1">Active Package</p>
                <p className="text-base font-bold text-aura-text truncate">{activeSub?.plan?.name || 'Active Package'}</p>
                <p className="text-xs text-aura-success mt-1 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Active
                </p>
              </div>

              <div className="bg-aura-card border border-aura-border rounded-xl p-4">
                <p className="text-xs text-aura-muted mb-1">Plan Validity</p>
                <p className="text-lg font-extrabold text-aura-success">{remSubDays} Days Left</p>
                <p className="text-xs text-aura-muted mt-1 truncate">
                  {subEndDate ? `Expires ${formatDate(subEndDate)}` : 'Active'}
                </p>
              </div>

              <div className="bg-aura-card border border-aura-border rounded-xl p-4">
                <p className="text-xs text-aura-muted mb-1">Total Visits</p>
                <p className="text-xl font-extrabold text-aura-primary">{userAttendance.length}</p>
                <p className="text-xs text-aura-muted mt-1">Gym check-ins</p>
              </div>
            </div>

            {/* Plan Validity Progress Bar */}
            {activeSub && (
              <div className="bg-aura-card border border-aura-border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-aura-muted flex items-center gap-1.5 font-medium">
                    <Clock className="h-3.5 w-3.5 text-aura-primary" /> Subscription Validity Progress
                  </span>
                  <span className="font-bold text-aura-success">{remSubDays} of {totSubDays} Days Remaining</span>
                </div>
                <div className="w-full h-2.5 bg-aura-bg border border-aura-border rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-aura-primary via-aura-success to-aura-success transition-all duration-500 rounded-full"
                    style={{ width: `${subProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Attendance Timeline */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-aura-text text-sm mb-3 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-aura-primary" /> My Gym Attendance Logs
                </h3>
                {userAttendance.length === 0 ? (
                  <div className="text-center py-8 text-aura-muted text-xs border border-dashed border-aura-border rounded-xl">
                    No check-in logs recorded yet. Click "Scan Reception QR Code" when visiting the gym to mark your daily attendance!
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

      {/* Reception QR Code Scanner Modal */}
      <Modal open={showScannerModal} onClose={() => setShowScannerModal(false)} title="Scan Reception Desk QR Code">
        <div className="space-y-4">
          <p className="text-xs text-aura-muted">
            Point your camera at the printed reception QR code standee or paste the active QR token string displayed at the desk.
          </p>
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Active Reception QR Token *</label>
            <input
              type="text"
              placeholder="Paste or scan QR token (e.g. i50ce8v90ePB1RkSBePkm2fd-gKfCddw)"
              value={scannedQrCode}
              onChange={(e) => setScannedQrCode(e.target.value)}
              className="w-full bg-aura-bg border border-aura-border rounded-lg px-3 py-2.5 text-xs text-aura-text font-mono focus:outline-none focus:border-aura-primary"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowScannerModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!scannedQrCode || qrCheckInMutation.isPending}
              onClick={handleScanCheckin}
              className="gap-2 text-xs"
            >
              <LogIn className="h-4 w-4" />
              {qrCheckInMutation.isPending ? 'Verifying Check-in...' : 'Verify & Check In Now'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
