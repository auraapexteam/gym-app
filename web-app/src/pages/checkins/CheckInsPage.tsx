import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle, SearchInput, Badge, StatCard, Select, Modal, Button } from '@/components/ui';
import { UserCheck, Users, QrCode, LogIn, RefreshCw, ShieldCheck, Printer, Download, Sparkles, Building2 } from 'lucide-react';
import { formatDateTime } from '@/utils';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store';

import { useAttendance, useManualCheckIn } from '@/hooks/useAttendance';
import { useMembers } from '@/hooks/useMembers';
import { useActiveQr, useGenerateQr } from '@/hooks/useQr';

export default function CheckInsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  const { data: membersRes } = useMembers({ page: 1, limit: 100 });
  const membersList = membersRes?.data || [];

  const { data: attendanceData = [], isLoading } = useAttendance();
  const { data: activeQr } = useActiveQr();
  const generateQrMutation = useGenerateQr();
  const manualCheckinMutation = useManualCheckIn();

  const gymName = user?.gymName || 'Apex Fitness Center';

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

  const handlePrintStandee = () => {
    window.print();
  };

  // 100% Dynamic Calculated Metrics
  const todayTotal = (attendanceData || []).length;
  const currentlyInside = (attendanceData || []).filter((c: any) => !c.checkOutTime).length;
  const qrScans = (attendanceData || []).filter((c: any) => c.method === 'qr').length;
  const manualCheckins = (attendanceData || []).filter((c: any) => c.method === 'manual').length;

  const stats = [
    { title: "Today's Total Check-ins", value: todayTotal, icon: UserCheck, iconColor: 'text-aura-success' },
    { title: 'Currently Inside', value: currentlyInside, icon: Users, iconColor: 'text-blue-400' },
    { title: 'QR Code Scans', value: qrScans, icon: QrCode, iconColor: 'text-aura-primary' },
    { title: 'Desk Manual Check-ins', value: manualCheckins, icon: ShieldCheck, iconColor: 'text-aura-warning' },
  ];

  const qrToken = activeQr?.qrValue || 'AURA-APEX-ACTIVE-QR-TOKEN';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrToken)}`;

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Check-ins' }]}
    >
      {/* Dedicated A4 Print Page Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          #root, .fixed, [role="dialog"], header, nav, sidebar {
            display: none !important;
          }
          #printable-a4-pdf-standalone {
            display: flex !important;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 auto !important;
            padding: 20mm 15mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-sizing: border-box !important;
            z-index: 9999999 !important;
          }
        }
        @media screen {
          #printable-a4-pdf-standalone {
            display: none !important;
          }
        }
      `}</style>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Reception Check-in Station</h1>
          <p className="text-sm text-aura-muted mt-0.5">Live gym reception QR display and real-time attendance feed</p>
        </div>
        <Button variant="primary" onClick={() => setShowPrintModal(true)} className="gap-2">
          <Printer className="h-4 w-4" /> Download / Print A4 Standee
        </Button>
      </div>

      {/* Dynamic Stats */}
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
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="bg-white p-3 rounded-xl shadow-aura-md border border-aura-primary/30 mb-4"
                >
                  <img
                    src={qrImageUrl}
                    alt="Live Scannable Gym QR Code"
                    className="h-44 w-44 rounded object-contain"
                  />
                </motion.div>
                
                <p className="text-xs text-aura-muted mb-1">Scan with Customer Mobile App to Check In</p>
                <div className="font-mono text-xs font-semibold text-aura-primary bg-aura-primary/10 border border-aura-primary/20 px-3 py-1 rounded-md mb-4 max-w-full truncate">
                  {qrToken}
                </div>

                <div className="grid grid-cols-2 gap-2 w-full">
                  <button
                    onClick={handleRotateQr}
                    disabled={generateQrMutation.isPending}
                    className="flex items-center justify-center gap-1.5 bg-aura-card border border-aura-border hover:border-aura-primary/50 text-aura-text text-xs font-semibold py-2 rounded-md transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-aura-primary ${generateQrMutation.isPending ? 'animate-spin' : ''}`} />
                    Rotate QR
                  </button>
                  <button
                    onClick={() => setShowPrintModal(true)}
                    className="flex items-center justify-center gap-1.5 bg-aura-primary/10 border border-aura-primary/20 text-aura-primary text-xs font-semibold py-2 rounded-md hover:bg-aura-primary/20 transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print A4
                  </button>
                </div>
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

      {/* Printable A4 Reception QR Standee Modal */}
      <Modal open={showPrintModal} onClose={() => setShowPrintModal(false)} title="Printable A4 Reception QR Poster">
        <div className="space-y-4">
          {/* Printable Container */}
          <div id="printable-a4-standee" className="bg-white text-black p-8 rounded-xl border border-gray-300 flex flex-col items-center justify-between text-center space-y-6">
            {/* Header */}
            <div className="flex flex-col items-center gap-2 border-b-2 border-black/10 pb-4 w-full">
              <div className="h-14 w-14 rounded-2xl bg-black text-white flex items-center justify-center font-black text-2xl shadow-md">
                {gymName.charAt(0)}
              </div>
              <h2 className="text-2xl font-extrabold uppercase tracking-wide text-gray-900">{gymName}</h2>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Official Member Check-in Station</p>
            </div>

            {/* QR Graphic */}
            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-black shadow-inner flex flex-col items-center">
              <img src={qrImageUrl} alt="A4 Scannable QR Code" className="h-60 w-60 object-contain" />
              <p className="font-mono text-xs font-bold text-gray-700 mt-3 bg-gray-200 px-3 py-1 rounded">
                Token: {qrToken}
              </p>
            </div>

            {/* Instructions */}
            <div className="space-y-2 max-w-sm text-left bg-gray-50 p-4 rounded-xl border border-gray-200 w-full text-xs text-gray-800">
              <p className="font-bold uppercase tracking-wider text-center text-gray-900 mb-2">How To Check In:</p>
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
                <span>Open <strong>Aura Apex Mobile App</strong> on your phone.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                <span>Tap <strong>QR Check-in Scanner</strong> on your dashboard.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
                <span>Point your phone camera at this reception poster.</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-2 border-t border-gray-200 w-full">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Powered by Aura Apex Gym Platform</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowPrintModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handlePrintStandee} className="gap-2">
              <Printer className="h-4 w-4" /> Print / Save PDF
            </Button>
          </div>
        </div>
      </Modal>

      {/* Standalone Printable A4 PDF Container */}
      <div id="printable-a4-pdf-standalone" className="text-black bg-white">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 border-b-4 border-black pb-6 w-full text-center">
          <div className="h-20 w-20 rounded-3xl bg-black text-white flex items-center justify-center font-black text-4xl shadow-xl">
            {gymName.charAt(0)}
          </div>
          <h1 className="text-4xl font-black uppercase tracking-wider text-black mt-1">{gymName}</h1>
          <span className="inline-block bg-black text-white text-xs font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full">
            Official Reception Check-in Station
          </span>
        </div>

        {/* QR Graphic */}
        <div className="flex flex-col items-center justify-center my-auto py-8 text-center w-full">
          <div className="p-8 rounded-3xl border-4 border-black bg-gray-50 shadow-2xl flex flex-col items-center">
            <img src={qrImageUrl} alt="A4 QR Code" className="h-72 w-72 object-contain" />
            <div className="mt-5 bg-black text-white font-mono text-sm font-bold px-6 py-2.5 rounded-xl tracking-wider">
              TOKEN: {qrToken}
            </div>
          </div>
          <p className="text-sm font-bold text-gray-700 mt-4 uppercase tracking-widest">Scan using Aura Apex Mobile App</p>
        </div>

        {/* Instructions & Footer */}
        <div className="w-full space-y-4 text-center">
          <div className="bg-gray-100 p-6 rounded-2xl border-2 border-black text-left max-w-md mx-auto">
            <p className="font-extrabold uppercase tracking-wider text-center text-black text-xs mb-3">Easy 3-Step Check In:</p>
            <div className="space-y-2.5 text-xs font-semibold text-gray-900">
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center font-black text-xs shrink-0">1</span>
                <span>Open <strong>Aura Apex Mobile App</strong> on your phone.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center font-black text-xs shrink-0">2</span>
                <span>Tap <strong>QR Check-in Scanner</strong> on your home dashboard.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center font-black text-xs shrink-0">3</span>
                <span>Point camera at this QR Poster for instant verification.</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-gray-200">
            <p className="text-xs font-mono text-gray-500 font-bold uppercase tracking-widest">
              Powered by Aura Apex Gym Management System
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
