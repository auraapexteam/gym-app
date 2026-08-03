import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import {
  SearchInput, Badge, Avatar, Pagination, EmptyListState, Select, Button,
} from '@/components/ui';
import { ConfirmModal } from '@/components/ui/modal';
import { useMembers, useDeleteMember, useSuspendMember } from '@/hooks/useMembers';
import { formatDate, isExpiringSoon } from '@/utils';
import { MEMBERSHIP_STATUS_COLORS } from '@/constants';
import { membersApi } from '@/api';
import { toast } from 'sonner';
import {
  UserPlus, Download, MoreHorizontal, Eye, UserX, RefreshCw,
  Trash2, AlertTriangle,
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

export default function MembersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<Member | null>(null);
  const [suspendModal, setSuspendModal] = useState<Member | null>(null);

  const { data, isLoading } = useMembers({ page, limit: 10, search, status: status || undefined });
  const deleteMutation = useDeleteMember();
  const suspendMutation = useSuspendMember();

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

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Members' }]}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-aura-muted mt-0.5">
            {data?.total ?? 0} total members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="primary" size="md" onClick={() => navigate('/members/add')}>
            <UserPlus className="h-4 w-4" /> Add Member
          </Button>
        </div>
      </div>

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
                : data?.data.map((member) => {
                    const expiring = isExpiringSoon(member.renewDate);
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
                            <Avatar name={member.name} src={member.avatar} size="sm" />
                            <div>
                              <p className="font-medium text-aura-text">{member.name}</p>
                              <p className="text-xs text-aura-muted">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Plan */}
                        <td className="px-4 py-3">
                          <p className="text-aura-text">{member.membershipPlan}</p>
                          <p className="text-xs text-aura-muted">{member.memberId}</p>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge variant={statusVariantMap[member.membershipStatus] ?? 'muted'} className="capitalize">
                            {member.membershipStatus}
                          </Badge>
                        </td>
                        {/* Renew Date */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {expiring && <AlertTriangle className="h-3.5 w-3.5 text-aura-warning shrink-0" />}
                            <span className={expiring ? 'text-aura-warning' : 'text-aura-text'}>
                              {formatDate(member.renewDate)}
                            </span>
                          </div>
                        </td>
                        {/* Attendance */}
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-aura-text font-medium">{member.attendance}%</span>
                            <div className="w-16 h-1.5 bg-aura-bg rounded-full mt-1">
                              <div
                                className="h-full rounded-full bg-aura-primary"
                                style={{ width: `${member.attendance}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        {/* Trainer */}
                        <td className="px-4 py-3 text-aura-muted">
                          {member.trainerName ?? '—'}
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)}
                              className="p-1.5 rounded-md text-aura-muted hover:text-aura-text hover:bg-white/5 transition-colors"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {openMenu === member.id && (
                              <div className="absolute right-0 z-10 mt-1 w-40 bg-aura-card border border-aura-border rounded-lg shadow-aura-lg overflow-hidden">
                                {[
                                  { label: 'View Profile', icon: Eye, action: () => navigate(`/members/${member.id}`) },
                                  { label: 'Renew', icon: RefreshCw, action: () => {} },
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
          {!isLoading && !data?.data.length && (
            <EmptyListState entity="members" onAdd={() => navigate('/members/add')} />
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
    </DashboardLayout>
  );
}
