import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Badge, Button, SearchInput, Skeleton } from '@/components/ui';
import { useGymDirectory, useJoinRequestStatus, useApplyJoinGym } from '@/hooks/useGyms';
import { useAttendance } from '@/hooks/useAttendance';
import { useAuthStore } from '@/store';
import { formatDate } from '@/utils';
import {
  Building2, MapPin, Phone, Mail, CheckCircle2, Clock, XCircle, QrCode, Sparkles, UserCheck, Dumbbell, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function BrowseGymsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const { data: gyms = [], isLoading: gymsLoading } = useGymDirectory();
  const { data: joinStatus, isLoading: statusLoading } = useJoinRequestStatus();
  const { data: userAttendance = [] } = useAttendance();
  const applyMutation = useApplyJoinGym();

  const filteredGyms = gyms.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.city && g.city.toLowerCase().includes(search.toLowerCase())) ||
    (g.address && g.address.toLowerCase().includes(search.toLowerCase()))
  );

  const isApprovedMember = joinStatus?.status === 'approved';
  const approvedGym = isApprovedMember ? gyms.find((g) => g.id === joinStatus?.gymId) : null;
  const qrPassToken = `MEMBER-${user?.id?.substring(0, 8).toUpperCase() || 'PASS'}`;
  const qrPassImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPassToken)}`;

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Customer Portal', href: '/browse-gyms' }, { label: isApprovedMember ? 'My Gym Dashboard' : 'Browse Gyms' }]}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* IF APPROVED: Render Customer Member Dashboard */}
        {isApprovedMember ? (
          <div className="space-y-6">
            {/* Active Membership Banner */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-aura-success/20 via-aura-primary/10 to-aura-card border border-aura-success/30 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-aura-success/20 border border-aura-success/40 flex items-center justify-center text-aura-success font-bold shrink-0">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-aura-text">{approvedGym?.name || joinStatus?.gymName || 'Active Gym Member'}</h2>
                    <Badge variant="success">APPROVED MEMBER</Badge>
                  </div>
                  <p className="text-xs text-aura-muted mt-1">
                    Welcome back, <span className="text-aura-text font-semibold">{user?.name}</span>! Your membership is active.
                  </p>
                </div>
              </div>
            </motion.div>

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
                    <p className="text-xs text-aura-muted mb-1">Active Membership</p>
                    <p className="text-base font-bold text-aura-text">{approvedGym?.name || 'Iron Paradise Gym'}</p>
                    <p className="text-xs text-aura-success mt-1 font-semibold">Standard Access Plan</p>
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

            <div className="border-t border-aura-border pt-6">
              <h3 className="text-lg font-bold text-aura-text mb-4">Explore Other Gym Directory Locations</h3>
            </div>
          </div>
        ) : (
          /* IF PENDING OR NOT APPLIED: Banner */
          joinStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                joinStatus.status === 'pending'
                  ? 'bg-aura-warning/10 border-aura-warning/30 text-aura-warning'
                  : 'bg-aura-danger/10 border-aura-danger/30 text-aura-danger'
              }`}
            >
              <div className="flex items-center gap-3">
                {joinStatus.status === 'pending' && <Clock className="h-6 w-6 shrink-0 animate-pulse" />}
                {joinStatus.status === 'rejected' && <XCircle className="h-6 w-6 shrink-0" />}
                <div>
                  <p className="font-semibold text-sm">
                    {joinStatus.status === 'pending' && 'Application Pending Owner Approval'}
                    {joinStatus.status === 'rejected' && 'Application Request Update'}
                  </p>
                  <p className="text-xs opacity-90 mt-0.5">
                    {joinStatus.status === 'pending' && `Your join application to ${joinStatus.gymName || 'the gym'} is under review by the gym owner.`}
                    {joinStatus.status === 'rejected' && 'Your previous join request was not approved. You can choose another gym below.'}
                  </p>
                </div>
              </div>
              <Badge variant={joinStatus.status === 'pending' ? 'warning' : 'danger'}>
                {joinStatus.status.toUpperCase()}
              </Badge>
            </motion.div>
          )
        )}

        {/* Hero Header */}
        {!isApprovedMember && (
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
        )}

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
            {filteredGyms.map((gym, i) => {
              const isApplied = joinStatus?.gymId === gym.id;
              const isPending = isApplied && joinStatus?.status === 'pending';
              const isApproved = isApplied && joinStatus?.status === 'approved';

              return (
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
                      {isApproved ? (
                        <div className="w-full py-2.5 rounded-lg bg-aura-success/10 border border-aura-success/30 text-aura-success text-xs font-bold flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-4 w-4" /> Joined Gym — Active Member
                        </div>
                      ) : isPending ? (
                        <div className="w-full py-2.5 rounded-lg bg-aura-warning/10 border border-aura-warning/30 text-aura-warning text-xs font-bold flex items-center justify-center gap-2">
                          <Clock className="h-4 w-4 animate-pulse" /> Pending Approval
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          disabled={applyMutation.isPending}
                          onClick={() => applyMutation.mutate(gym.id)}
                          className="w-full gap-2 text-xs py-2.5 font-semibold"
                        >
                          <ShieldCheck className="h-4 w-4" /> Apply to Join Gym
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
