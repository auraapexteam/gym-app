import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Modal } from '@/components/ui';
import { usePlans } from '@/hooks/usePlans';
import { useCreateManualSubscription, useMySubscriptions } from '@/hooks/useSubscriptions';
import { useJoinRequestStatus, useGymDirectory } from '@/hooks/useGyms';
import { useAuthStore } from '@/store';
import { Zap, CheckCircle2, CreditCard, ShieldCheck, Building2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CustomerPlansPage() {
  const { user } = useAuthStore();
  const { data: plansData, isLoading: plansLoading } = usePlans();
  const { data: joinStatus } = useJoinRequestStatus();
  const { data: gyms = [] } = useGymDirectory();
  const { data: mySubscriptions = [] } = useMySubscriptions();
  const createSubscriptionMutation = useCreateManualSubscription();

  const activePlans = Array.isArray(plansData) ? plansData : (plansData as any)?.data || [];
  const isApproved = joinStatus?.status === 'approved';
  const approvedGym = isApproved ? gyms.find((g) => g.id === joinStatus?.gymId) : null;

  const handleSubscribe = (planId: string) => {
    if (!user?.id) return;
    createSubscriptionMutation.mutate({
      memberId: user.id,
      planId,
      method: 'upi',
    });
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Customer Portal', href: '/dashboard' }, { label: 'Membership Plans' }]}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-aura-card border border-aura-border p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-aura-text">Membership Plans & Packages</h1>
            <p className="text-sm text-aura-muted mt-1">
              Select and activate a membership plan for <span className="text-aura-text font-semibold">{approvedGym?.name || joinStatus?.gymName || 'your gym'}</span>
            </p>
          </div>
          <Badge variant="success" className="gap-1 text-xs">
            <Building2 className="h-3.5 w-3.5" /> {approvedGym?.name || joinStatus?.gymName || 'Active Gym Member'}
          </Badge>
        </div>

        {/* Plans Grid */}
        {plansLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
          </div>
        ) : activePlans.length === 0 ? (
          <Card className="p-12 text-center">
            <Zap className="h-12 w-12 text-aura-muted mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-aura-text">No Plans Created Yet</h3>
            <p className="text-sm text-aura-muted mt-1">The gym owner has not listed any public membership packages yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activePlans.map((plan: any, i: number) => {
              const isCurrentActivePlan = (mySubscriptions || []).some(
                (s: any) => (s.planId === plan.id || s.plan?.id === plan.id) && s.status === 'active'
              );

              return (
                <motion.div
                  key={plan.id || i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`h-full flex flex-col justify-between transition-all duration-300 ${
                    isCurrentActivePlan
                      ? 'border-2 border-aura-success/70 bg-gradient-to-b from-aura-success/15 via-aura-card to-aura-card shadow-aura-md'
                      : 'hover:border-aura-primary/50'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <h3 className="font-bold text-aura-text text-lg">{plan.name || plan.title}</h3>
                        {isCurrentActivePlan ? (
                          <Badge variant="success" className="gap-1 font-bold text-[10px] uppercase tracking-wider shrink-0">
                            <Sparkles className="h-3 w-3" /> ACTIVE PLAN
                          </Badge>
                        ) : (
                          <Badge variant="info" className="shrink-0">{plan.durationDays || plan.duration || 30} Days</Badge>
                        )}
                      </div>

                      <div className="mb-4">
                        <span className="text-3xl font-extrabold text-aura-primary">₹{plan.price}</span>
                        <span className="text-xs text-aura-muted ml-1">/ package</span>
                      </div>

                      <p className="text-sm text-aura-muted mb-4 border-t border-aura-border pt-3 leading-relaxed">
                        {plan.description || 'Full gym facility access, equipment usage, and daily reception check-in privileges.'}
                      </p>

                      {Array.isArray(plan.features) && plan.features.length > 0 && (
                        <div className="space-y-2 text-xs text-aura-text">
                          {plan.features.map((f: string) => (
                            <div key={f} className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-aura-success shrink-0" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>

                    <div className="p-6 pt-0">
                      {isCurrentActivePlan ? (
                        <div className="w-full py-2.5 rounded-xl bg-aura-success/20 border border-aura-success/40 text-aura-success text-xs font-extrabold flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-4 w-4" /> Active Membership Package
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          disabled={createSubscriptionMutation.isPending}
                          onClick={() => handleSubscribe(plan.id)}
                          className="w-full gap-2 text-xs font-semibold py-2.5"
                        >
                          <CreditCard className="h-4 w-4" />
                          {createSubscriptionMutation.isPending ? 'Activating Package...' : 'Subscribe / Buy Package'}
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
