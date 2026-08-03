import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Users, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

const weeklyData = [
  { day: 'Mon', members: 120, trainers: 8 },
  { day: 'Tue', members: 98, trainers: 7 },
  { day: 'Wed', members: 145, trainers: 9 },
  { day: 'Thu', members: 132, trainers: 8 },
  { day: 'Fri', members: 160, trainers: 10 },
  { day: 'Sat', members: 187, trainers: 11 },
  { day: 'Sun', members: 75, trainers: 5 },
];

const heatmapData = Array.from({ length: 7 }, (_, week) =>
  Array.from({ length: 7 }, (_, day) => ({
    week,
    day,
    count: Math.floor(Math.random() * 200) + 20,
  })),
).flat();

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const stats = [
  { title: 'Today Total', value: 147, icon: Users, iconColor: 'text-aura-primary' },
  { title: 'Weekly Avg', value: 131, icon: TrendingUp, iconColor: 'text-aura-success' },
  { title: 'Peak Hour', value: '6 PM', icon: Clock, iconColor: 'text-aura-warning' },
  { title: 'Late Arrivals', value: 12, icon: AlertTriangle, iconColor: 'text-aura-danger' },
];

export default function AttendancePage() {
  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Attendance' }]}
    >
      <div className="mb-6">
        <h1 className="text-xl font-bold text-aura-text">Attendance</h1>
        <p className="text-sm text-aura-muted mt-0.5">Member and trainer attendance analytics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatCard key={s.title} {...s} index={i} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Weekly Chart */}
        <Card>
          <CardHeader className="p-6 pb-4">
            <CardTitle>Weekly Attendance</CardTitle>
            <p className="text-xs text-aura-muted">Member vs trainer check-ins by day</p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
                <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1B1D22', border: '1px solid #2A2D35', borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="members" name="Members" fill="#C6FF00" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="trainers" name="Trainers" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Heat Map */}
        <Card>
          <CardHeader className="p-6 pb-4">
            <CardTitle>Attendance Heat Map</CardTitle>
            <p className="text-xs text-aura-muted">Last 7 weeks attendance pattern</p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex gap-1 mb-2">
              {DAY_LABELS.map((d) => (
                <div key={d} className="flex-1 text-center text-xs text-aura-muted">{d}</div>
              ))}
            </div>
            {Array.from({ length: 7 }).map((_, week) => (
              <div key={week} className="flex gap-1 mb-1">
                {Array.from({ length: 7 }).map((_, day) => {
                  const count = heatmapData.find((d) => d.week === week && d.day === day)?.count ?? 0;
                  const opacity = Math.min(count / 200, 1);
                  return (
                    <div
                      key={day}
                      title={`${count} check-ins`}
                      className="flex-1 aspect-square rounded-sm"
                      style={{ backgroundColor: `rgba(198, 255, 0, ${0.1 + opacity * 0.9})` }}
                    />
                  );
                })}
              </div>
            ))}
            <div className="flex items-center justify-end gap-2 mt-3">
              <span className="text-xs text-aura-muted">Low</span>
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((o) => (
                <div key={o} className="h-3 w-3 rounded-sm" style={{ backgroundColor: `rgba(198, 255, 0, ${o})` }} />
              ))}
              <span className="text-xs text-aura-muted">High</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Late Arrivals Table */}
      <Card>
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-aura-warning" />
            Late Arrivals Today
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-aura-border">
                {['Member', 'Scheduled', 'Arrived', 'Delay'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-aura-muted uppercase tracking-wider first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-border">
              {[
                { name: 'Arjun Sharma', scheduled: '6:00 AM', arrived: '6:18 AM', delay: '18 min' },
                { name: 'Priya Patel', scheduled: '7:00 AM', arrived: '7:25 AM', delay: '25 min' },
                { name: 'Rahul Gupta', scheduled: '5:00 PM', arrived: '5:32 PM', delay: '32 min' },
              ].map((item, i) => (
                <tr key={i} className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 pl-6 font-medium text-aura-text">{item.name}</td>
                  <td className="px-4 py-3 text-aura-muted">{item.scheduled}</td>
                  <td className="px-4 py-3 text-aura-text">{item.arrived}</td>
                  <td className="px-4 py-3">
                    <span className="text-aura-warning font-medium">{item.delay}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
