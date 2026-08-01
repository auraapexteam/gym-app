import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle, Badge, Avatar, Button, Skeleton } from '@/components/ui';
import { useMember } from '@/hooks/useMembers';
import { formatDate, formatCurrency, isExpiringSoon } from '@/utils';
import {
  Phone, Mail, Calendar, Dumbbell, QrCode, ArrowLeft,
  Activity, CreditCard, Package, FileText, User,
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'attendance', label: 'Attendance', icon: Activity },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'orders', label: 'Nutrition Orders', icon: Package },
  { id: 'notes', label: 'Notes', icon: FileText },
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
  const [activeTab, setActiveTab] = useState('overview');

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
                  <Badge variant={statusVariantMap[member.membershipStatus] ?? 'muted'} className="capitalize">
                    {member.membershipStatus}
                  </Badge>
                  {expiring && (
                    <Badge variant="warning">Expiring soon</Badge>
                  )}
                </div>
                <p className="text-sm text-aura-muted mb-3">{member.memberId}</p>
                <div className="flex flex-wrap gap-4 text-sm text-aura-muted">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {member.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {member.phone}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Joined {formatDate(member.joinedAt)}
                  </span>
                  {member.trainerName && (
                    <span className="flex items-center gap-1.5">
                      <Dumbbell className="h-3.5 w-3.5" /> {member.trainerName}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <Button variant="secondary" size="sm">
                  <QrCode className="h-4 w-4" /> QR Code
                </Button>
                <Button variant="primary" size="sm">
                  Renew Membership
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Membership Plan', value: member.membershipPlan },
            { label: 'Renew Date', value: formatDate(member.renewDate), highlight: expiring },
            { label: 'Attendance', value: `${member.attendance}%` },
            { label: 'Total Visits', value: member.visits.toString() },
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
                      { label: 'Email', value: member.email },
                      { label: 'Phone', value: member.phone },
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
                      { label: 'Plan', value: member.membershipPlan },
                      { label: 'Status', value: <Badge variant={statusVariantMap[member.membershipStatus] ?? 'muted'} className="capitalize">{member.membershipStatus}</Badge> },
                      { label: 'Renew Date', value: formatDate(member.renewDate) },
                      { label: 'Assigned Trainer', value: member.trainerName ?? '—' },
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
            {activeTab === 'attendance' && (
              <div className="text-center py-8 text-aura-muted">
                Attendance history coming soon...
              </div>
            )}
            {activeTab === 'payments' && (
              <div className="text-center py-8 text-aura-muted">
                Payment history coming soon...
              </div>
            )}
            {activeTab === 'orders' && (
              <div className="text-center py-8 text-aura-muted">
                Nutrition orders coming soon...
              </div>
            )}
            {activeTab === 'notes' && (
              <div>
                <textarea
                  placeholder="Add notes about this member..."
                  className="w-full h-32 bg-aura-bg border border-aura-border rounded-md p-3 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary focus:ring-1 focus:ring-aura-primary/30 resize-none"
                />
                <Button variant="primary" size="sm" className="mt-3">Save Notes</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
