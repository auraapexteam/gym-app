import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts';
import {
  SearchInput, Badge, Avatar, Pagination, EmptyListState, Select, Button, Modal,
} from '@/components/ui';
import { ConfirmModal } from '@/components/ui/modal';
import { useMembers, useDeleteMember, useSuspendMember, useCreateMember } from '@/hooks/useMembers';
import { usePlans } from '@/hooks/usePlans';
import { useCreateManualSubscription } from '@/hooks/useSubscriptions';
import { usePendingJoinRequests, useApproveJoinRequest, useRejectJoinRequest } from '@/hooks/useGyms';
import { formatDate, isExpiringSoon } from '@/utils';
import { MEMBERSHIP_STATUS_COLORS } from '@/constants';
import { membersApi } from '@/api';
import { toast } from 'sonner';
import {
  UserPlus, Download, MoreHorizontal, Eye, UserX, RefreshCw,
  Trash2, AlertTriangle, CheckCircle2, Clock, UserCheck, XCircle, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Member } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'frozen', label: 'Frozen' },
];

const statusVariantMap: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'muted'> = {
  active: 'success',
  expired: 'danger',
  suspended: 'warning',
  frozen: 'info',
  pending: 'muted',
};

interface MembersPageProps {
  defaultShowAdd?: boolean;
}

export default function MembersPage({ defaultShowAdd = false }: MembersPageProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<Member | null>(null);
  const [suspendModal, setSuspendModal] = useState<Member | null>(null);
  const [showAddModal, setShowAddModal] = useState(defaultShowAdd);

  useEffect(() => {
    if (!showAddModal && window.location.pathname === '/members/add') {
      navigate('/members');
    }
  }, [showAddModal, navigate]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');

  const [activateModal, setActivateModal] = useState<Member | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [activeViewTab, setActiveViewTab] = useState<'directory' | 'pending'>('directory');

  const { data, isLoading } = useMembers({ page, limit: 10, search, status: status || undefined });
  const { data: plansData } = usePlans();
  const activePlans = Array.isArray(plansData) ? plansData : (plansData as any)?.data || [];

  const { data: pendingRequests = [] } = usePendingJoinRequests();
  const approveMutation = useApproveJoinRequest();
  const rejectMutation = useRejectJoinRequest();

  const deleteMutation = useDeleteMember();
  const suspendMutation = useSuspendMember();
  const createMutation = useCreateMember();
  const activateSubscriptionMutation = useCreateManualSubscription();

  const handleExport = async () => {
    try {
      toast.success('Preparing members CSV export...');
      const res = await membersApi.exportCSV();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `members_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Members CSV downloaded successfully!');
    } catch (err) {
      toast.error('Failed to export members list.');
    }
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        fullName,
        email: email || undefined,
        phone: phone || undefined,
        gender,
        dateOfBirth: dateOfBirth || undefined,
        address: address || undefined,
        emergencyContact: emergencyContact || undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setShowAddModal(false);
          setFullName('');
          setEmail('');
          setPhone('');
          setGender('male');
          setDateOfBirth('');
          setAddress('');
          setEmergencyContact('');
          setNotes('');
        },
      }
    );
  };

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Members' }]}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Gym Members Directory</h1>
          <p className="text-sm text-aura-muted mt-0.5">
            {data?.total ?? 0} total active members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="primary" size="md" onClick={() => setShowAddModal(true)}>
            <UserPlus className="h-4 w-4" /> Add Member
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 mb-6 border-b border-aura-border pb-2">
        <button
          onClick={() => setActiveViewTab('directory')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeViewTab === 'directory'
              ? 'bg-aura-primary text-aura-bg'
              : 'text-aura-muted hover:text-aura-text hover:bg-white/5'
          }`}
        >
          <Users className="h-4 w-4" /> Active Directory
        </button>
        <button
          onClick={() => setActiveViewTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeViewTab === 'pending'
              ? 'bg-aura-primary text-aura-bg'
              : 'text-aura-muted hover:text-aura-text hover:bg-white/5'
          }`}
        >
          <Clock className="h-4 w-4" /> Pending Applications
          {pendingRequests.length > 0 && (
            <Badge variant="warning" className="ml-1 text-xs px-1.5 py-0.5">
              {pendingRequests.length}
            </Badge>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      {activeViewTab === 'pending' ? (
        <div className="bg-aura-card border border-aura-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-aura-text">Pending Customer Join Applications</h3>
              <p className="text-xs text-aura-muted">Approve customer applications to register them as official gym members</p>
            </div>
            <Badge variant="warning">{pendingRequests.length} Pending</Badge>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="py-12 text-center text-aura-muted text-sm border border-dashed border-aura-border rounded-xl">
              No pending customer join applications right now.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-aura-border text-left">
                    {['Applicant Name', 'Email / Contact', 'Requested Date', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="pb-3 text-xs font-semibold text-aura-muted uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-aura-border">
                  {pendingRequests.map((req: any) => {
                    const profile = req.profiles || req.profile || {};
                    const applicantName = profile.full_name || profile.fullName || req.userName || req.userEmail || 'Customer Applicant';
                    const contactInfo = profile.email || profile.phone || req.userEmail || req.userPhone || '—';
                    return (
                      <tr key={req.id} className="hover:bg-white/3 transition-colors">
                        <td className="py-3 font-semibold text-aura-text">
                          <div className="flex items-center gap-3">
                            <Avatar name={applicantName} src={profile.avatar_url || profile.avatar} size="sm" />
                            <span className="font-bold text-white">{applicantName}</span>
                          </div>
                        </td>
                        <td className="py-3 text-aura-muted font-medium">
                          {contactInfo}
                        </td>
                        <td className="py-3 text-aura-muted text-xs">
                          {formatDate(req.createdAt || req.created_at)}
                        </td>
                        <td className="py-3">
                          <Badge variant="warning" className="capitalize font-bold">
                            {req.status}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={approveMutation.isPending}
                              onClick={() => approveMutation.mutate(req.id)}
                              className="gap-1.5 text-xs font-semibold"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Approve Member
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={rejectMutation.isPending}
                              onClick={() => rejectMutation.mutate(req.id)}
                              className="gap-1.5 text-xs font-semibold"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="bg-aura-card border border-aura-border rounded-lg mb-4">
            <div className="flex items-center gap-3 p-4">
              <SearchInput
                value={search}
                onChange={(v) => { setSearch(v); setPage(1); }}
                placeholder="Search by name, email, or member ID..."
                className="flex-1 max-w-sm"
              />
              <Select
                options={STATUS_OPTIONS}
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="w-40"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-aura-border text-left">
                {['Member', 'Plan', 'Status', 'Renew Date', 'Attendance', 'Trainer', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-aura-muted uppercase tracking-wider whitespace-nowrap first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-border">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3 first:pl-6">
                          <div className="h-4 rounded bg-white/5 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : (data?.data || []).map((member) => {
                    const name = member.name || (member as any).fullName || 'Member';
                    const email = member.email || '';
                    const renewDate = member.renewDate || (member as any).createdAt || (member as any).created_at || new Date().toISOString();
                    const membershipPlan = member.membershipPlan || (member as any).planName || 'Standard Plan';
                    const membershipStatus = member.membershipStatus || (member as any).status || 'active';
                    const expiring = isExpiringSoon(renewDate);
                    return (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-white/3 transition-colors group"
                      >
                        {/* Member */}
                        <td className="px-4 py-3 pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar name={name} src={member.avatar} size="sm" />
                            <div>
                              <p className="font-medium text-aura-text">{name}</p>
                              <p className="text-xs text-aura-muted">{email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Plan */}
                        <td className="px-4 py-3">
                          <p className="text-aura-text">{membershipPlan}</p>
                          <p className="text-xs text-aura-muted">{member.memberId || member.id.slice(0, 8)}</p>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge variant={statusVariantMap[membershipStatus] ?? 'muted'} className="capitalize">
                            {membershipStatus}
                          </Badge>
                        </td>
                        {/* Renew Date */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {expiring && <AlertTriangle className="h-3.5 w-3.5 text-aura-warning shrink-0" />}
                            <span className={expiring ? 'text-aura-warning' : 'text-aura-text'}>
                              {formatDate(renewDate)}
                            </span>
                          </div>
                        </td>
                        {/* Attendance */}
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-aura-text font-medium">{member.attendance || 0}%</span>
                            <div className="w-16 h-1.5 bg-aura-bg rounded-full mt-1">
                              <div
                                className="h-full bg-aura-primary rounded-full"
                                style={{ width: `${Math.min(100, member.attendance || 0)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        {/* Trainer */}
                        <td className="px-4 py-3 text-aura-muted">
                          {(member as any).assignedTrainer || (member as any).trainerName || 'Unassigned'}
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="relative flex justify-end">
                            <button
                              onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)}
                              className="p-1 text-aura-muted hover:text-aura-text rounded-md hover:bg-white/5 transition-colors"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>

                            {openMenu === member.id && (
                              <div className="absolute right-0 z-10 mt-1 w-40 bg-aura-card border border-aura-border rounded-lg shadow-aura-lg overflow-hidden">
                                {[
                                  { label: 'View Profile', icon: Eye, action: () => navigate(`/members/${member.id}`) },
                                  { label: 'Activate / Renew Plan', icon: RefreshCw, action: () => { setActivateModal(member); setOpenMenu(null); } },
                                  { label: 'Suspend', icon: UserX, action: () => { setSuspendModal(member); setOpenMenu(null); } },
                                  { label: 'Delete', icon: Trash2, action: () => { setDeleteModal(member); setOpenMenu(null); }, danger: true },
                                ].map((item) => (
                                  <button
                                    key={item.label}
                                    onClick={() => { item.action(); setOpenMenu(null); }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors ${item.danger ? 'text-aura-danger' : 'text-aura-muted hover:text-aura-text'}`}
                                  >
                                    <item.icon className="h-3.5 w-3.5" />
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
            </tbody>
          </table>
          {!isLoading && (!data?.data || data.data.length === 0) && (
            <EmptyListState entity="members" onAdd={() => setShowAddModal(true)} />
          )}
        </div>

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="px-4 py-4 border-t border-aura-border">
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              limit={data.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
      </>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={() => {
          if (deleteModal) {
            deleteMutation.mutate(deleteModal.id);
            setDeleteModal(null);
          }
        }}
        title="Delete Member"
        description={`Are you sure you want to delete ${deleteModal?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />

      {/* Suspend Confirm */}
      <ConfirmModal
        open={!!suspendModal}
        onClose={() => setSuspendModal(null)}
        onConfirm={() => {
          if (suspendModal) {
            suspendMutation.mutate({ id: suspendModal.id });
            setSuspendModal(null);
          }
        }}
        title="Suspend Member"
        description={`Are you sure you want to suspend ${suspendModal?.name}?`}
        confirmLabel="Suspend"
        variant="warning"
        loading={suspendMutation.isPending}
      />

      {/* Add Member Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Member"
        size="md"
      >
        <form onSubmit={handleAddMemberSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-aura-text mb-1.5">Full Name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-aura-text mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-aura-text mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-aura-text mb-1.5">Gender</label>
                <Select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                  className="text-xs h-10 bg-aura-bg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-aura-text mb-1.5">Date of Birth (YYYY-MM-DD)</label>
                <input
                  type="text"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  placeholder="e.g. 1995-08-23"
                  className="w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-aura-text mb-1.5">Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Street Name, City"
                className="w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-aura-text mb-1.5">Emergency Contact</label>
              <input
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="e.g. Spouse/Parent contact number"
                className="w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-aura-text mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Important medical details, fitness targets..."
                rows={2}
                className="w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={createMutation.isPending}>
                Register Member
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Activate / Renew Membership Plan Modal */}
      <Modal open={!!activateModal} onClose={() => setActivateModal(null)} title={`Activate Membership Plan: ${activateModal?.name || 'Member'}`}>
        <div className="space-y-4">
          <p className="text-xs text-aura-muted">Select an active membership plan to assign to this member. This will activate their subscription immediately for check-ins.</p>
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
            <Button variant="outline" onClick={() => setActivateModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!selectedPlanId || activateSubscriptionMutation.isPending}
              onClick={() => {
                if (!activateModal || !selectedPlanId) return;
                activateSubscriptionMutation.mutate(
                  { memberId: activateModal.id, planId: selectedPlanId, method: 'cash' },
                  {
                    onSuccess: () => {
                      setActivateModal(null);
                      setSelectedPlanId('');
                    },
                  }
                );
              }}
            >
              {activateSubscriptionMutation.isPending ? 'Activating Plan...' : 'Activate Plan Now'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
