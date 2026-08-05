import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle, SearchInput, Badge, StatCard, Select } from '@/components/ui';
import { UserCheck, Clock, Users, TrendingUp, QrCode, LogIn, RefreshCw, ShieldCheck } from 'lucide-react';
import { formatDateTime } from '@/utils';
import { motion } from 'framer-motion';

import { useAttendance, useManualCheckIn } from '@/hooks/useAttendance';
import { useMembers } from '@/hooks/useMembers';
import { useActiveQr, useGenerateQr } from '@/hooks/useQr';

export default function CheckInsPage() {
  const [search, setSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');

  const { data: membersRes } = useMembers({ page: 1, limit: 100 });
  const membersList = membersRes?.data || [];

  const { data: attendanceData = [], isLoading } = useAttendance();
  const { data: activeQr, isLoading: qrLoading } = useActiveQr();
  const generateQrMutation = useGenerateQr();
  const manualCheckinMutation = useManualCheckIn();

  const filtered = (attendanceData || []).filter((c: any) => {
    const name = c.memberName || c.memberFullName || c.memberId || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const handleManualCheckin = () => {
    if (!selectedMemberId) return;
    manualCheckinMutation.mutate({ memberId: selectedMemberId });
    setSelectedMemberId('');
  };

  const handleRotateQr = () => {
    generateQrMutation.mutate('Daily Reception Token');
  };

  const stats = [
    { title: "Today's Check-ins", value: attendanceData.length, icon: UserCheck, iconColor: 'text-aura-success' },
    { title: 'Currently Inside', value: attendanceData.filter((c: any) => !c.checkOutTime).length, icon: Users, iconColor: 'text-blue-400' },
    { title: 'Peak Hour', value: '6 PM', icon: Clock, iconColor: 'text-aura-warning' },
    { title: 'Avg. Stay', value: '1.2h', icon: TrendingUp, iconColor: 'text-aura-primary' },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Check-ins' }]}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Reception Check-in Station</h1>
          <p className="text-sm text-aura-muted mt-0.5">Live gym reception QR display and real-time attendance feed</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <StatCard key={s.title} {...s} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active QR & Manual Check-in */}
        <div className="space-y-4">
          {/* Active Gym QR Display Card */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-aura-primary" />
                  <span>Reception QR Display</span>
                </div>
                <Badge variant="success" className="text-xs">Live Active</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="rounded-lg bg-aura-bg border border-aura-border p-6 flex flex-col items-center justify-center text-center">
                <motion.div
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="bg-white p-4 rounded-xl shadow-aura-md border border-aura-primary/30 mb-4"
                >
                  <QrCode className="h-32 w-32 text-black" />
                </motion.div>
                
                <p className="text-xs text-aura-muted mb-1">Scan with Customer Mobile App to Check In</p>
                <div className="font-mono text-xs font-semibold text-aura-primary bg-aura-primary/10 border border-aura-primary/20 px-3 py-1 rounded-md mb-4 max-w-full truncate">
                  {activeQr?.qrValue || 'QR-DAILY-ACTIVE-TOKEN'}
                </div>

                <button
                  onClick={handleRotateQr}
                  disabled={generateQrMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 bg-aura-card border border-aura-border hover:border-aura-primary/50 text-aura-text text-xs font-semibold py-2.5 rounded-md transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-aura-primary ${generateQrMutation.isPending ? 'animate-spin' : ''}`} />
                  Rotate Daily QR Token
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Front Desk Manual Check-in */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-aura-success" />
                Front Desk Manual Check-in
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="space-y-3">
                <label className="block text-xs font-medium text-aura-muted mb-1">Select Gym Member</label>
                <Select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  placeholder={membersList.length ? "Choose a member..." : "No members registered yet"}
                  options={membersList.map((m: any) => ({
                    value: m.id,
                    label: `${m.name || m.fullName || 'Member'} (${m.email || 'No Email'})`,
                  }))}
                />
                <button
                  onClick={handleManualCheckin}
                  disabled={!selectedMemberId || manualCheckinMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 bg-aura-primary text-aura-bg border border-aura-primary rounded-md py-2.5 text-sm font-semibold hover:bg-aura-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  {manualCheckinMutation.isPending ? 'Checking In...' : 'Check In Selected Member'}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Attendance Feed */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Today's Attendance Feed</CardTitle>
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
                    {['Member', 'Check In Time', 'Method', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-aura-muted uppercase tracking-wider first:pl-6">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-aura-border">
                  {filtered.map((c: any) => {
                    const memberName = c.memberName || c.memberFullName || c.memberId || 'Member';
                    const method = c.method || 'qr';
                    const isInside = !c.checkOutTime;

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
                              {memberName.charAt(0)}
                            </div>
                            <span className="font-medium text-aura-text">{memberName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-aura-muted">
                          {formatDateTime(c.checkInTime || c.created_at || new Date())}
                        </td>
                        <td className="px-4 py-3 text-aura-muted uppercase text-xs font-mono">
                          {method}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={isInside ? 'success' : 'muted'}>
                            {isInside ? 'Checked In' : 'Completed'}
                          </Badge>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              {!filtered.length && (
                <div className="py-12 text-center text-aura-muted text-sm">
                  No check-ins logged today
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
