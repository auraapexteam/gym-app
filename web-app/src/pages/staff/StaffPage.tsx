import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Badge, Button, SearchInput, StatCard, Modal, Input } from '@/components/ui';
import { Users, UserCog, Plus, Clock, Trash2 } from 'lucide-react';
import { formatDate } from '@/utils';
import { motion } from 'framer-motion';
import { useStaff, useCreateStaff, useDeleteStaff } from '@/hooks/useStaff';

const roleVariantMap: Record<string, 'success' | 'info' | 'warning' | 'default' | 'muted'> = {
  manager: 'success',
  receptionist: 'info',
  cashier: 'default',
  staff: 'info',
  support: 'muted',
};

export default function StaffPage() {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');

  const { data: staffList = [], isLoading } = useStaff();
  const createMutation = useCreateStaff();
  const deleteMutation = useDeleteStaff();

  const filtered = (staffList || []).filter((s) =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.role || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    createMutation.mutate(
      {
        fullName: fullName.trim(),
        email: email.trim(),
        password: password || 'Password123!',
      },
      {
        onSuccess: () => {
          setShowAddModal(false);
          setFullName('');
          setEmail('');
          setPassword('Password123!');
        },
      }
    );
  };

  const stats = [
    { title: 'Total Staff', value: staffList.length, icon: Users, iconColor: 'text-aura-primary' },
    { title: 'Active Accounts', value: staffList.filter((s) => s.status === 'active').length, icon: UserCog, iconColor: 'text-aura-success' },
    { title: 'Morning Shift', value: staffList.filter((s) => s.shift.includes('Morning')).length, icon: Clock, iconColor: 'text-aura-warning' },
    { title: 'Avg Attendance', value: `${staffList.length ? 95 : 0}%`, icon: Users, iconColor: 'text-aura-info' },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Staff' }]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Staff Directory</h1>
          <p className="text-sm text-aura-muted mt-0.5">{staffList.length} registered staff members</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search staff..." className="w-56" />
          <Button variant="primary" onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Staff Member
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatCard key={s.title} {...s} index={i} />)}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-aura-border text-left">
                {['Staff Member', 'Role', 'Shift', 'Joined Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-aura-muted uppercase tracking-wider first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-border">
              {filtered.map((staff, i) => (
                <motion.tr
                  key={staff.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-white/3 transition-colors"
                >
                  <td className="px-4 py-3.5 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-aura-primary/10 flex items-center justify-center font-bold text-aura-primary border border-aura-primary/20">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-aura-text">{staff.name}</p>
                        <p className="text-xs text-aura-muted">{staff.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={roleVariantMap[staff.role] ?? 'info'} className="capitalize">
                      {staff.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-aura-text">{staff.shift}</td>
                  <td className="px-4 py-3.5 text-aura-muted text-xs">{formatDate(staff.joinedAt)}</td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => deleteMutation.mutate(staff.id)}
                      className="p-1.5 text-aura-muted hover:text-aura-danger rounded-md hover:bg-aura-danger/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Onboard New Staff Member">
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Staff Full Name *</label>
            <Input
              type="text"
              required
              placeholder="e.g. Sarah Jenkins"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Email Address *</label>
            <Input
              type="email"
              required
              placeholder="e.g. sarah@gym.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Login Password *</label>
            <Input
              type="text"
              required
              placeholder="Password123!"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-xs font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Onboard Staff
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
