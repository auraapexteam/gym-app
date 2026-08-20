import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Users, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { useAttendanceStats, useAttendance } from '@/hooks/useAttendance';
import { useAttendanceChart } from '@/hooks/useDashboard';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AttendancePage() {
  const { data: attendanceData = [] } = useAttendance();
  const { data: chartData = [] } = useAttendanceChart();
  const { data: statsData } = useAttendanceStats();

  const todayCount = attendanceData.length;
  const currentlyInside = attendanceData.filter((c: any) => !c.checkOutTime).length;

  const weeklyData = Array.isArray(chartData) && chartData.length > 0
    ? chartData.map((d: any) => ({
        day: d.day || d.date || d.name || 'Day',
        checkins: Number(d.checkins ?? d.checkIns ?? d.count ?? d.value ?? 0),
      }))
    : [
        { day: 'Mon', checkins: 0 },
        { day: 'Tue', checkins: 0 },
        { day: 'Wed', checkins: 0 },
        { day: 'Thu', checkins: 0 },
        { day: 'Fri', checkins: 0 },
        { day: 'Sat', checkins: 0 },
        { day: 'Sun', checkins: 0 },
      ];

  const qrScans = (attendanceData || []).filter((c: any) => c.method === 'qr').length;
  const manualLogs = (attendanceData || []).filter((c: any) => c.method === 'manual').length;

  const stats = [
    { title: "Today's Total Check-ins", value: todayCount, icon: Users, iconColor: 'text-aura-primary' },
    { title: 'Currently Inside', value: currentlyInside, icon: TrendingUp, iconColor: 'text-aura-success' },
    { title: 'QR Code Scans', value: qrScans, icon: Clock, iconColor: 'text-aura-warning' },
    { title: 'Desk Manual Logs', value: manualLogs, icon: AlertTriangle, iconColor: 'text-aura-danger' },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Attendance' }]}
    >
      <div className="mb-6">
        <h1 className="text-xl font-bold text-aura-text">Attendance Analytics</h1>
        <p className="text-sm text-aura-muted mt-0.5">Real-time member and trainer attendance insights</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatCard key={s.title} {...s} index={i} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 mb-4">
        {/* Weekly Chart */}
        <Card>
          <CardHeader className="p-6 pb-4">
            <CardTitle>Weekly Attendance Trend</CardTitle>
            <p className="text-xs text-aura-muted">Live member check-ins by day from backend database</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
                <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A1D24', borderColor: '#2A2D35', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#C6FF00' }}
                />
                <Bar dataKey="checkins" fill="#C6FF00" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
