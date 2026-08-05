import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Badge, Button, SearchInput, StatCard } from '@/components/ui';
import { Users, UserCog, Plus, Clock } from 'lucide-react';
import type { Staff } from '@/types';
import { formatDate } from '@/utils';
import { motion } from 'framer-motion';

const roleVariantMap: Record<string, 'success' | 'info' | 'warning' | 'default' | 'muted'> = {
  manager: 'success',
  receptionist: 'info',
  cashier: 'default',
  support: 'muted',
};

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [search, setSearch] = useState('');

  const filtered = staffList.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = [
    { title: 'Total Staff', value: staffList.length, icon: Users, iconColor: 'text-aura-primary' },
    { title: 'On Duty', value: 0, icon: UserCog, iconColor: 'text-aura-success' },
    { title: 'Morning Shift', value: staffList.filter((s) => s.shift.includes('Morning')).length, icon: Clock, iconColor: 'text-aura-warning' },
    { title: 'Avg Attendance', value: `${staffList.length ? Math.round(staffList.reduce((a, s) => a + s.attendance, 0) / staffList.length) : 0}%`, icon: Users, iconColor: 'text-aura-info' },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Staff' }]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Staff</h1>
          <p className="text-sm text-aura-muted mt-0.5">{staffList.length} staff members</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search staff..." className="w-56" />
          <Button variant="primary">
            <Plus className="h-4 w-4" /> Add Staff
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
              <tr>
                {['Staff Member', 'Role', 'Shift', 'Salary', 'Attendance', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-aura-muted uppercase tracking-wider first:pl-6">
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
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-white/3 transition-colors"
                >
                  <td className="px-4 py-3.5 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-aura-primary/10 flex items-center justify-center text-xs font-bold text-aura-primary shrink-0">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-aura-text">{staff.name}</p>
                        <p className="text-xs text-aura-muted">{staff.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={roleVariantMap[staff.role] ?? 'muted'} className="capitalize">
                      {staff.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-aura-muted text-xs">{staff.shift}</td>
                  <td className="px-4 py-3.5 font-semibold text-aura-text">
                    ₹{staff.salary.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-16 h-1.5 bg-aura-bg rounded-full">
                        <div className="h-full rounded-full bg-aura-primary" style={{ width: `${staff.attendance}%` }} />
                      </div>
                      <span className="text-xs text-aura-text">{staff.attendance}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-aura-muted text-xs">{formatDate(staff.joinedAt)}</td>
                  <td className="px-4 py-3.5">
                    <button className="text-xs text-aura-primary hover:underline">Edit</button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
