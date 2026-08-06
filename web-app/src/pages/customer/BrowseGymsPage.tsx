import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Badge, Button, SearchInput, Skeleton } from '@/components/ui';
import { useGymDirectory, useJoinRequestStatus, useApplyJoinGym } from '@/hooks/useGyms';
import { useAttendance } from '@/hooks/useAttendance';
import { useMySubscriptions } from '@/hooks/useSubscriptions';
import { useAuthStore } from '@/store';
import { formatDate } from '@/utils';
import {
  Building2, MapPin, Phone, Mail, CheckCircle2, Clock, XCircle, QrCode, UserCheck, ShieldCheck, CreditCard, Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function BrowseGymsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data: gyms = [], isLoading: gymsLoading } = useGymDirectory();
  const { data: joinStatus, isLoading: statusLoading } = useJoinRequestStatus();
  const { data: userAttendance = [] } = useAttendance();
  const { data: mySubscriptions = [] } = useMySubscriptions();
  const applyMutation = useApplyJoinGym();

  const filteredGyms = gyms.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.city && g.city.toLowerCase().includes(search.toLowerCase())) ||
    (g.address && g.address.toLowerCase().includes(search.toLowerCase()))
  );

  const isApprovedMember = !!user?.gymId || joinStatus?.status === 'approved';
  const isPendingMember = !isApprovedMember && joinStatus?.status === 'pending';
  const approvedGym = isApprovedMember ? (gyms.find((g) => g.id === (user?.gymId || joinStatus?.gymId)) || { name: user?.gymName || joinStatus?.gymName || 'Active Gym' }) : null;
  const pendingGym = isPendingMember ? gyms.find((g) => g.id === joinStatus?.gymId) : null;

  const activeSubscription = mySubscriptions.find((s: any) => s.status === 'active');
  const hasActivePlan = !!activeSubscription;

  const qrPassToken = `MEMBER-${user?.id?.substring(0, 8).toUpperCase() || 'PASS'}`;
  const qrPassImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPassToken)}`;

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Customer Portal', href: '/browse-gyms' },
        { label: isApprovedMember ? 'My Gym Dashboard' : isPendingMember ? 'Application Status' : 'Browse Gyms' },
      ]}
    >
      <div className="max-w-6xl mx-auto space-y-6">

        {/* 1. IF APPROVED: Customer Member Dashboard */}
        {isApprovedMember && (
          <div className="space-y-6">
            {/* Active Membership Banner */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border ${
                hasActivePlan
                  ? 'bg-gradient-to-r from-aura-success/20 via-aura-primary/10 to-aura-card border-aura-success/30'
                  : 'bg-gradient-to-r from-aura-warning/20 via-aura-card to-aura-card border-aura-warning/40'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center font-bold shrink-0 ${
                  hasActivePlan
                    ? 'bg-aura-success/20 border-aura-success/40 text-aura-success'
                    : 'bg-aura-warning/20 border-aura-warning/40 text-aura-warning'
                }`}>
                  {hasActivePlan ? <CheckCircle2 className="h-8 w-8" /> : <CreditCard className="h-8 w-8" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-aura-text">{approvedGym?.name || joinStatus?.gymName || 'Active Gym Member'}</h2>
                    <Badge variant={hasActivePlan ? "success" : "warning"}>
                      {hasActivePlan ? "APPROVED MEMBER" : "PLAN ACTIVATION REQUIRED"}
                    </Badge>
                  </div>
                  <p className="text-xs text-aura-muted mt-1">
                    Welcome back, <span className="text-aura-text font-semibold">{user?.name}</span>! {hasActivePlan ? 'Your membership is active.' : 'Select a membership plan to unlock your digital pass.'}
                  </p>
                </div>
              </div>

              {!hasActivePlan && (
                <Button
                  variant="primary"
                  onClick={() => navigate('/customer/plans')}
                  className="gap-2 font-bold text-xs"
                >
                  <CreditCard className="h-4 w-4" /> Subscribe / Select Plan
                </Button>
              )}
            </motion.div>

            {hasActivePlan ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Member QR Check-in Pass Card */}
                <Card className="lg:col-span-1 border-aura-primary/40">
                  <CardContent className="p-6 text-center flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-3">
                      <QrCode className="h-5 w-5 text-aura-primary" />
                      <h3 className="font-bold text-aura-text text-sm uppercase tracking-wider">My Digital Check-in Pass</h3>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border-2 border-aura-primary/30 shadow-aura-md my-2">
                      <img src={qrPassImageUrl} alt="Member Digital Checkin Pass" className="h-48 w-48 object-contain rounded" />
                    </div>

                    <p className="text-xs text-aura-muted mt-2">Present this QR pass at reception for instant scan</p>
                    <p className="font-mono text-xs font-bold text-aura-primary bg-aura-primary/10 border border-aura-primary/20 px-3 py-1 rounded mt-2">
                      {qrPassToken}
                    </p>
                  </CardContent>
                </Card>

                {/* Membership Overview & Attendance History */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-aura-card border border-aura-border rounded-xl p-4">
                      <p className="text-xs text-aura-muted mb-1">Active Plan</p>
                      <p className="text-base font-bold text-aura-text">{activeSubscription?.plan?.name || 'Active Package'}</p>
                      <p className="text-xs text-aura-success mt-1 font-semibold">Active Membership</p>
                    </div>
                    <div className="bg-aura-card border border-aura-border rounded-xl p-4">
                      <p className="text-xs text-aura-muted mb-1">Total Visits</p>
                      <p className="text-xl font-extrabold text-aura-primary">{userAttendance.length}</p>
                      <p className="text-xs text-aura-muted mt-1">Recorded check-ins</p>
                    </div>
                  </div>

                  {/* Personal Attendance Logs */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-aura-text text-sm mb-3 flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-aura-primary" /> My Recent Check-in Logs
                      </h3>
                      {userAttendance.length === 0 ? (
                        <div className="text-center py-8 text-aura-muted text-xs border border-dashed border-aura-border rounded-xl">
                          No check-ins recorded yet. Scan your digital QR pass at reception when you visit the gym!
                        </div>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-aura-border text-left">
                              <th className="pb-2 font-semibold text-aura-muted">Date & Time</th>
                              <th className="pb-2 font-semibold text-aura-muted">Method</th>
                              <th className="pb-2 font-semibold text-aura-muted">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-aura-border">
                            {userAttendance.slice(0, 5).map((a: any) => (
                              <tr key={a.id} className="hover:bg-white/3">
                                <td className="py-2.5 text-aura-text font-medium">{formatDate(a.checkInTime || a.created_at)}</td>
                                <td className="py-2.5 uppercase font-mono text-aura-muted">{a.method || 'qr'}</td>
                                <td className="py-2.5">
                                  <Badge variant="success">Checked In</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              /* IF APPROVED BUT NO ACTIVE PLAN: Prompt Card */
              <Card className="border-aura-warning/40 p-8 text-center bg-gradient-to-b from-aura-warning/5 to-aura-card">
                <CardContent className="p-0 max-w-lg mx-auto flex flex-col items-center">
                  <div className="h-16 w-16 rounded-2xl bg-aura-warning/20 border border-aura-warning/40 flex items-center justify-center text-aura-warning mb-4">
                    <Lock className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-aura-text mb-2">Membership Plan Activation Required</h3>
                  <p className="text-xs text-aura-muted leading-relaxed mb-6">
                    Your join application has been approved by gym management! To activate your membership and unlock your digital QR check-in pass, please choose a membership plan.
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate('/customer/plans')}
                    className="gap-2 font-bold text-xs px-8"
                  >
                    <CreditCard className="h-4 w-4" /> View & Activate Membership Plan
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 2. IF PENDING: Dedicated Pending Application Status Card */}
        {isPendingMember && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <Card className="border-aura-warning/40 bg-gradient-to-b from-aura-warning/10 via-aura-card to-aura-card p-8">
              <CardContent className="p-0 text-center max-w-xl mx-auto flex flex-col items-center">
                <div className="h-20 w-20 rounded-3xl bg-aura-warning/20 border-2 border-aura-warning/40 flex items-center justify-center text-aura-warning shadow-lg mb-6">
                  <Clock className="h-10 w-10 animate-pulse" />
                </div>

                <Badge variant="warning" className="text-xs px-3 py-1 font-bold mb-3 uppercase tracking-wider">
                  Application Under Review
                </Badge>

                <h2 className="text-2xl font-extrabold text-aura-text mb-2">
                  Application Pending Owner Approval
                </h2>

                <p className="text-sm text-aura-muted leading-relaxed mb-6">
                  Your request to join <span className="font-bold text-white">{pendingGym?.name || joinStatus?.gymName || 'the gym'}</span> is currently being reviewed by gym management. Once approved by the gym owner, your active membership portal will unlock automatically.
                </p>

                <div className="w-full bg-[#0d0f12] border border-aura-border/80 rounded-2xl p-5 text-left space-y-3 mb-4">
                  <div className="flex items-center justify-between text-xs border-b border-aura-border/60 pb-3">
                    <span className="text-aura-muted">Target Gym:</span>
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-aura-primary" />
                      {pendingGym?.name || joinStatus?.gymName || 'Gym Center'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-b border-aura-border/60 pb-3">
                    <span className="text-aura-muted">Applicant Name:</span>
                    <span className="font-medium text-aura-text">{user?.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-aura-muted">Application Date:</span>
                    <span className="font-medium text-aura-text">{formatDate(joinStatus?.createdAt || new Date())}</span>
                  </div>
                </div>

                <p className="text-xs text-aura-muted italic">
                  Need assistance? Contact reception directly or wait for approval notification.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 3. IF NO APPLICATION OR REJECTED: Show Directory Grid */}
        {!isApprovedMember && !isPendingMember && (
          <div className="space-y-6">
            {joinStatus?.status === 'rejected' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-aura-danger/30 bg-aura-danger/10 text-aura-danger flex items-center gap-3 text-sm"
              >
                <XCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">Previous Join Request Update</p>
                  <p className="text-xs opacity-90 mt-0.5">Your previous join request was not approved. You may select another gym below to apply.</p>
                </div>
              </motion.div>
            )}

            {/* Hero Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-aura-card border border-aura-border p-6 rounded-2xl">
              <div>
                <h1 className="text-2xl font-bold text-aura-text">Explore & Join Fitness Centers</h1>
                <p className="text-sm text-aura-muted mt-1">Select a verified gym to submit your member join application</p>
              </div>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search gym by name or city..."
                className="w-full md:w-72"
              />
            </div>

            {/* Gym Directory Cards Grid */}
            {gymsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
              </div>
            ) : filteredGyms.length === 0 ? (
              <Card className="p-12 text-center">
                <Building2 className="h-12 w-12 text-aura-muted mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-aura-text">No Gyms Found</h3>
                <p className="text-sm text-aura-muted mt-1">No registered gyms match your current search terms.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGyms.map((gym, i) => (
                  <motion.div
                    key={gym.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="h-full flex flex-col justify-between hover:border-aura-primary/40 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-12 w-12 rounded-xl bg-aura-primary/10 border border-aura-primary/20 flex items-center justify-center font-bold text-lg text-aura-primary shrink-0">
                            {gym.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-aura-text text-base leading-snug">{gym.name}</h3>
                            <p className="text-xs text-aura-muted flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-aura-primary" /> {gym.city || gym.address || 'India'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-aura-muted border-t border-aura-border pt-4 mb-4">
                          {gym.address && (
                            <p className="flex items-center gap-2 truncate">
                              <Building2 className="h-3.5 w-3.5 text-aura-muted shrink-0" /> {gym.address}
                            </p>
                          )}
                          {gym.phone && (
                            <p className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-aura-muted shrink-0" /> {gym.phone}
                            </p>
                          )}
                          {gym.email && (
                            <p className="flex items-center gap-2 truncate">
                              <Mail className="h-3.5 w-3.5 text-aura-muted shrink-0" /> {gym.email}
                            </p>
                          )}
                        </div>
                      </CardContent>

                      <div className="p-6 pt-0">
                        <Button
                          variant="primary"
                          disabled={applyMutation.isPending}
                          onClick={() => applyMutation.mutate(gym.id)}
                          className="w-full gap-2 text-xs py-2.5 font-semibold"
                        >
                          <ShieldCheck className="h-4 w-4" /> Apply to Join Gym
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
