import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Badge, Avatar, Button, Skeleton, Modal, Select } from '@/components/ui';
import { useMember, useUpdateMember } from '@/hooks/useMembers';
import { useAttendance } from '@/hooks/useAttendance';
import { usePlans } from '@/hooks/usePlans';
import { useCreateManualSubscription } from '@/hooks/useSubscriptions';
import { paymentsApi, subscriptionsApi } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { formatDate, formatCurrency, isExpiringSoon } from '@/utils';
import {
  Phone, Mail, Calendar, Dumbbell, QrCode, ArrowLeft,
  Activity, CreditCard, Package, FileText, User, Save, RefreshCw, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'attendance', label: 'Attendance History', icon: Activity },
  { id: 'payments', label: 'Payments & Billing', icon: CreditCard },
  { id: 'notes', label: 'Member Notes', icon: FileText },
];

const statusVariantMap: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'muted'> = {
  active: 'success',
  expired: 'danger',
  suspended: 'warning',
  frozen: 'info',
  pending: 'muted',
};

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: member, isLoading } = useMember(id!);
  const updateMemberMutation = useUpdateMember();
  const createSubscriptionMutation = useCreateManualSubscription();

  const [activeTab, setActiveTab] = useState('overview');
  const [notesText, setNotesText] = useState('');
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // Live member attendance history
  const { data: attendanceData = [], isLoading: attendanceLoading } = useAttendance({ memberId: id });
  
  // Live member payments
  const { data: paymentsData = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['member-payments', id],
    queryFn: async () => {
      if (!id) return [];
      const res = await paymentsApi.getAll({ memberId: id });
      return Array.isArray(res.data.data) ? res.data.data : [];
    },
    enabled: !!id,
  });

  // Live member subscriptions
  const { data: subscriptionsData = [] } = useQuery({
    queryKey: ['member-subscriptions', id],
    queryFn: async () => {
      if (!id) return [];
      const res = await subscriptionsApi.list({ memberId: id });
      return Array.isArray(res.data.data) ? res.data.data : [];
    },
    enabled: !!id,
  });

  const activeSub = (subscriptionsData || []).find((s: any) => s.status === 'active');
  const hasActiveSub = !!activeSub;
  const actualPlanName = activeSub?.plan?.name || activeSub?.planName || 'No Active Plan';
  const actualRenewDate = activeSub?.end_date || activeSub?.endDate || member?.renewDate;
  const actualStatus = hasActiveSub ? 'active' : (member?.membershipStatus === 'suspended' ? 'suspended' : 'inactive');

  const { data: plansData } = usePlans();
  const activePlans = Array.isArray(plansData) ? plansData : (plansData as any)?.data || [];

  useEffect(() => {
    if (member?.notes) {
      setNotesText(member.notes);
    }
  }, [member?.notes]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!member) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-aura-muted">Member not found.</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/members')}>
            Back to Members
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const expiring = isExpiringSoon(member.renewDate);

  const handleSaveNotes = () => {
    updateMemberMutation.mutate(
      { id: member.id, data: { notes: notesText } },
      {
        onSuccess: () => toast.success('Member notes saved to database.'),
      }
    );
  };

  const handleActivatePlan = () => {
    if (!selectedPlanId) return;
    createSubscriptionMutation.mutate(
      { memberId: member.id, planId: selectedPlanId, method: 'cash' },
      {
        onSuccess: () => {
          setShowRenewModal(false);
          setSelectedPlanId('');
        },
      }
    );
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Members', href: '/members' },
        { label: member.name },
      ]}
    >
      <div className="max-w-5xl">
        {/* Back */}
        <button
          onClick={() => navigate('/members')}
          className="flex items-center gap-2 text-sm text-aura-muted hover:text-aura-text transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to members
        </button>

        {/* Profile Header Card */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar name={member.name} src={member.avatar} size="xl" />

              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1 className="text-xl font-bold text-aura-text">{member.name}</h1>
                  <Badge variant={statusVariantMap[actualStatus] ?? 'muted'} className="capitalize">
                    {actualStatus}
                  </Badge>
                  {expiring && (
                    <Badge variant="warning">Expiring soon</Badge>
                  )}
                </div>
                <p className="text-sm text-aura-muted mb-3">{member.memberId}</p>
                <div className="flex flex-wrap gap-4 text-sm text-aura-muted">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {member.email || 'No email provided'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {member.phone || 'No phone provided'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Joined {formatDate(member.joinedAt)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <Button variant="primary" size="sm" onClick={() => setShowRenewModal(true)}>
                  <RefreshCw className="h-4 w-4" /> Renew / Activate Plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Membership Plan', value: actualPlanName },
            { label: 'Renew Date', value: formatDate(actualRenewDate), highlight: expiring },
            { label: 'Total Check-ins', value: attendanceData.length.toString() },
            { label: 'Total Invoices', value: paymentsData.length.toString() },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-aura-card border border-aura-border rounded-lg p-4"
            >
              <p className="text-xs text-aura-muted mb-1">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.highlight ? 'text-aura-warning' : 'text-aura-text'}`}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-aura-card border border-aura-border rounded-lg p-1 mb-4 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-aura-primary text-aura-bg'
                  : 'text-aura-muted hover:text-aura-text'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <Card>
          <CardContent className="p-6">
            {activeTab === 'overview' && (
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-aura-text mb-3">Personal Information</h3>
                  <dl className="space-y-2 text-sm">
                    {[
                      { label: 'Full Name', value: member.name },
                      { label: 'Email', value: member.email || '—' },
                      { label: 'Phone', value: member.phone || '—' },
                      { label: 'Member ID', value: member.memberId },
                      { label: 'Joined', value: formatDate(member.joinedAt) },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between">
                        <dt className="text-aura-muted">{item.label}</dt>
                        <dd className="text-aura-text font-medium">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-aura-text mb-3">Membership Details</h3>
                  <dl className="space-y-2 text-sm">
                    {[
                      { label: 'Plan', value: actualPlanName },
                      { label: 'Status', value: <Badge variant={statusVariantMap[actualStatus] ?? 'muted'} className="capitalize">{actualStatus}</Badge> },
                      { label: 'Renew Date', value: formatDate(actualRenewDate) },
                      { label: 'Assigned Trainer', value: member.trainerName || 'Unassigned' },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center">
                        <dt className="text-aura-muted">{item.label}</dt>
                        <dd className="text-aura-text font-medium">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}

            {/* Attendance History Tab */}
            {activeTab === 'attendance' && (
              <div>
                <h3 className="text-sm font-semibold text-aura-text mb-3">Member Attendance Logs</h3>
                {attendanceData.length === 0 ? (
                  <div className="text-center py-10 text-aura-muted text-sm border border-dashed border-aura-border rounded-lg">
                    No attendance logs found for this member yet.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-aura-border text-left">
                        {['Date & Time', 'Method', 'Status'].map((h) => (
                          <th key={h} className="pb-3 text-xs font-semibold text-aura-muted uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-aura-border">
                      {attendanceData.map((a: any) => (
                        <tr key={a.id} className="hover:bg-white/3 transition-colors">
                          <td className="py-3 text-aura-text font-medium">{formatDate(a.checkInTime || a.created_at)}</td>
                          <td className="py-3 text-aura-muted uppercase text-xs font-mono">{a.method || 'manual'}</td>
                          <td className="py-3">
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Checked In
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Payments History Tab */}
            {activeTab === 'payments' && (
              <div>
                <h3 className="text-sm font-semibold text-aura-text mb-3">Payment & Transaction History</h3>
                {paymentsData.length === 0 ? (
                  <div className="text-center py-10 text-aura-muted text-sm border border-dashed border-aura-border rounded-lg">
                    No payment history recorded for this member yet.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-aura-border text-left">
                        {['Transaction Date', 'Amount', 'Method', 'Status'].map((h) => (
                          <th key={h} className="pb-3 text-xs font-semibold text-aura-muted uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-aura-border">
                      {paymentsData.map((p: any) => (
                        <tr key={p.id} className="hover:bg-white/3 transition-colors">
                          <td className="py-3 text-aura-text font-medium">{formatDate(p.createdAt || p.created_at)}</td>
                          <td className="py-3 text-aura-text font-bold">₹{p.amount}</td>
                          <td className="py-3 text-aura-muted capitalize">{p.method || 'cash'}</td>
                          <td className="py-3">
                            <Badge variant={p.status === 'success' ? 'success' : 'warning'} className="capitalize">
                              {p.status || 'success'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Persistent Notes Tab */}
            {activeTab === 'notes' && (
              <div>
                <h3 className="text-sm font-semibold text-aura-text mb-2">Internal Member Notes</h3>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Record fitness goals, injury logs, or medical conditions..."
                  className="w-full h-36 bg-aura-bg border border-aura-border rounded-md p-3 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary focus:ring-1 focus:ring-aura-primary/30 resize-none font-mono"
                />
                <div className="flex justify-end mt-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={updateMemberMutation.isPending}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updateMemberMutation.isPending ? 'Saving Notes...' : 'Save Notes'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Renew / Activate Plan Modal */}
      <Modal open={showRenewModal} onClose={() => setShowRenewModal(false)} title={`Renew Membership: ${member.name}`}>
        <div className="space-y-4">
          <p className="text-xs text-aura-muted">Select an active membership plan to assign to this member.</p>
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Select Membership Plan *</label>
            <Select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              placeholder={activePlans.length ? "Choose a membership plan..." : "No active plans created yet"}
              options={activePlans.map((p: any) => ({
                value: p.id,
                label: `${p.name || p.title} — ₹${p.price} (${p.durationDays || p.duration || 30} Days)`,
              }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowRenewModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!selectedPlanId || createSubscriptionMutation.isPending}
              onClick={handleActivatePlan}
            >
              {createSubscriptionMutation.isPending ? 'Activating...' : 'Activate Plan'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
