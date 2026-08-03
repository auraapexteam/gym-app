import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle, SearchInput, Badge, StatCard } from '@/components/ui';
import { UserCheck, Clock, Users, TrendingUp, QrCode, LogIn, LogOut } from 'lucide-react';
import { formatDateTime, formatRelativeTime } from '@/utils';
import { motion } from 'framer-motion';

// Mock data
const mockCheckins = [
  { id: '1', memberId: 'm1', memberName: 'Arjun Sharma', checkInTime: new Date(Date.now() - 15 * 60000).toISOString(), checkOutTime: undefined, date: new Date().toDateString() },
  { id: '2', memberId: 'm2', memberName: 'Priya Patel', checkInTime: new Date(Date.now() - 45 * 60000).toISOString(), checkOutTime: new Date(Date.now() - 10 * 60000).toISOString(), date: new Date().toDateString() },
  { id: '3', memberId: 'm3', memberName: 'Rahul Gupta', checkInTime: new Date(Date.now() - 90 * 60000).toISOString(), checkOutTime: undefined, date: new Date().toDateString() },
  { id: '4', memberId: 'm4', memberName: 'Sneha Singh', checkInTime: new Date(Date.now() - 120 * 60000).toISOString(), checkOutTime: new Date(Date.now() - 30 * 60000).toISOString(), date: new Date().toDateString() },
  { id: '5', memberId: 'm5', memberName: 'Vikram Reddy', checkInTime: new Date(Date.now() - 180 * 60000).toISOString(), checkOutTime: new Date(Date.now() - 60 * 60000).toISOString(), date: new Date().toDateString() },
];

const stats = [
  { title: "Today's Check-ins", value: 147, icon: UserCheck, iconColor: 'text-aura-success' },
  { title: 'Currently Inside', value: 34, icon: Users, iconColor: 'text-blue-400' },
  { title: 'Peak Hour', value: '6 PM', icon: Clock, iconColor: 'text-aura-warning' },
  { title: 'Avg. Stay', value: '1.4h', icon: TrendingUp, iconColor: 'text-aura-primary' },
];

export default function CheckInsPage() {
  const [search, setSearch] = useState('');
  const [memberIdInput, setMemberIdInput] = useState('');

  const filtered = mockCheckins.filter((c) =>
    c.memberName.toLowerCase().includes(search.toLowerCase()),
  );

  const handleManualCheckin = () => {
    if (!memberIdInput.trim()) return;
    alert(`Manual check-in for member: ${memberIdInput}`);
    setMemberIdInput('');
  };

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Check-ins' }]}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-aura-muted mt-0.5">Track member attendance in real-time</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <StatCard key={s.title} {...s} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* QR Scanner & Manual Check-in */}
        <div className="space-y-4">
          {/* QR Scanner Card */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-aura-primary" />
                QR Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="aspect-square rounded-lg bg-aura-bg border-2 border-dashed border-aura-border flex flex-col items-center justify-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <QrCode className="h-16 w-16 text-aura-primary/40" />
                </motion.div>
                <p className="text-sm text-aura-muted text-center px-4">
                  Point camera at member QR code to scan
                </p>
                <button className="bg-aura-primary text-aura-bg text-sm font-semibold px-4 py-2 rounded-md hover:bg-aura-primary/90 transition-colors">
                  Start Camera
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Manual Check-in */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <CardTitle>Manual Check-in</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="space-y-3">
                <SearchInput
                  value={memberIdInput}
                  onChange={setMemberIdInput}
                  placeholder="Enter member ID or name..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleManualCheckin}
                    className="flex-1 flex items-center justify-center gap-2 bg-aura-success/10 text-aura-success border border-aura-success/20 rounded-md py-2 text-sm font-medium hover:bg-aura-success/20 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    Check In
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-aura-danger/10 text-aura-danger border border-aura-danger/20 rounded-md py-2 text-sm font-medium hover:bg-aura-danger/20 transition-colors">
                    <LogOut className="h-4 w-4" />
                    Check Out
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Attendance */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Today's Attendance</CardTitle>
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search members..."
                  className="w-48"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-aura-border">
                    {['Member', 'Check In', 'Check Out', 'Duration', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-aura-muted uppercase tracking-wider first:pl-6">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-aura-border">
                  {filtered.map((c) => {
                    const isInside = !c.checkOutTime;
                    const duration = c.checkOutTime
                      ? `${Math.round((new Date(c.checkOutTime).getTime() - new Date(c.checkInTime).getTime()) / 60000)} min`
                      : 'Active';
                    return (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-white/3 transition-colors"
                      >
                        <td className="px-4 py-3 pl-6">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-aura-primary/10 flex items-center justify-center text-xs font-bold text-aura-primary">
                              {c.memberName.charAt(0)}
                            </div>
                            <span className="font-medium text-aura-text">{c.memberName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-aura-muted">
                          {formatDateTime(c.checkInTime)}
                        </td>
                        <td className="px-4 py-3 text-aura-muted">
                          {c.checkOutTime ? formatDateTime(c.checkOutTime) : '—'}
                        </td>
                        <td className="px-4 py-3 text-aura-text">{duration}</td>
                        <td className="px-4 py-3">
                          <Badge variant={isInside ? 'success' : 'muted'}>
                            {isInside ? 'Inside' : 'Left'}
                          </Badge>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              {!filtered.length && (
                <div className="py-12 text-center text-aura-muted text-sm">
                  No check-ins found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
