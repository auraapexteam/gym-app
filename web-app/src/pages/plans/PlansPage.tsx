import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Badge, Button, Modal } from '@/components/ui';
import { Plus, Edit, Trash2, Check, Zap, Crown, Star } from 'lucide-react';
import { formatCurrency } from '@/utils';
import type { MembershipPlan } from '@/types';
import { motion } from 'framer-motion';

const mockPlans: MembershipPlan[] = [
  { id: '1', name: 'Daily Pass', type: 'daily', price: 200, duration: 1, benefits: ['Single day access', 'Locker facility', 'Basic equipment'], isActive: true, gymId: 'g1', createdAt: '2024-01-01' },
  { id: '2', name: 'Weekly Plan', type: 'weekly', price: 800, duration: 7, benefits: ['7-day access', 'Locker facility', 'All equipment', 'Workout guidance'], isActive: true, gymId: 'g1', createdAt: '2024-01-01' },
  { id: '3', name: 'Monthly Plan', type: 'monthly', price: 2999, duration: 30, benefits: ['30-day access', 'Locker facility', 'All equipment', 'Nutrition advice'], isActive: true, gymId: 'g1', createdAt: '2024-01-01' },
  { id: '4', name: 'Quarterly Plan', type: 'quarterly', price: 7999, duration: 90, benefits: ['90-day access', 'Locker facility', 'All equipment', 'Personal trainer session', 'Nutrition plan'], isActive: true, gymId: 'g1', createdAt: '2024-01-01' },
  { id: '5', name: 'Yearly Plan', type: 'yearly', price: 24999, duration: 365, benefits: ['365-day access', 'Priority locker', 'All equipment', '4 PT sessions/month', 'Nutrition plan', 'Free merchandise'], isActive: true, gymId: 'g1', createdAt: '2024-01-01' },
  { id: '6', name: 'Student Plan', type: 'student', price: 1999, duration: 30, benefits: ['30-day access', 'Basic equipment', 'Workout guidance', 'Student discount'], isActive: true, gymId: 'g1', createdAt: '2024-01-01' },
  { id: '7', name: 'Premium Plan', type: 'premium', price: 4999, duration: 30, benefits: ['30-day access', 'Premium locker', 'All equipment', '2 PT sessions', 'Nutrition plan', 'Sauna access'], isActive: true, gymId: 'g1', createdAt: '2024-01-01' },
  { id: '8', name: 'VIP Plan', type: 'vip', price: 9999, duration: 30, benefits: ['30-day access', 'VIP locker room', 'Priority access', '8 PT sessions', 'Custom nutrition plan', 'Sauna + Spa', 'Guest passes (2)'], isActive: true, gymId: 'g1', createdAt: '2024-01-01' },
];

const planIcons: Record<string, React.ElementType> = {
  daily: Zap,
  weekly: Star,
  monthly: Check,
  quarterly: Star,
  yearly: Crown,
  student: Zap,
  premium: Star,
  vip: Crown,
};

const planColors: Record<string, string> = {
  daily: 'text-aura-muted',
  weekly: 'text-blue-400',
  monthly: 'text-aura-primary',
  quarterly: 'text-purple-400',
  yearly: 'text-yellow-400',
  student: 'text-aura-success',
  premium: 'text-pink-400',
  vip: 'text-yellow-400',
};

export default function PlansPage() {
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState<MembershipPlan | null>(null);

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Membership Plans' }]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Membership Plans</h1>
          <p className="text-sm text-aura-muted mt-0.5">{mockPlans.length} plans available</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> Create Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockPlans.map((plan, i) => {
          const Icon = planIcons[plan.type] ?? Zap;
          const color = planColors[plan.type] ?? 'text-aura-primary';
          const isPopular = plan.type === 'monthly' || plan.type === 'yearly';

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`relative hover:border-aura-primary/40 transition-all duration-300 ${isPopular ? 'border-aura-primary/30' : ''}`}>
                {isPopular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="bg-aura-primary text-aura-bg text-xs font-bold px-2.5 py-0.5 rounded-full">
                      Popular
                    </span>
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`h-10 w-10 rounded-lg bg-aura-bg border border-aura-border flex items-center justify-center ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditPlan(plan); setShowModal(true); }}
                        className="p-1.5 text-aura-muted hover:text-aura-text hover:bg-white/5 rounded-md transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1.5 text-aura-muted hover:text-aura-danger hover:bg-aura-danger/10 rounded-md transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-aura-text mb-1">{plan.name}</h3>
                  <p className="text-xs text-aura-muted mb-3 capitalize">{plan.duration} day{plan.duration > 1 ? 's' : ''}</p>

                  <p className="text-2xl font-bold text-aura-text mb-4">
                    {formatCurrency(plan.price)}
                    <span className="text-sm text-aura-muted font-normal">
                      /{plan.duration === 1 ? 'day' : plan.duration <= 7 ? 'week' : 'period'}
                    </span>
                  </p>

                  <ul className="space-y-1.5 mb-4">
                    {plan.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-aura-muted">
                        <Check className="h-3.5 w-3.5 text-aura-primary shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between">
                    <Badge variant={plan.isActive ? 'success' : 'muted'}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-aura-muted capitalize">{plan.type}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditPlan(null); }}
        title={editPlan ? 'Edit Plan' : 'Create New Plan'}
        size="md"
      >
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-aura-text mb-1.5">Plan Name</label>
              <input
                defaultValue={editPlan?.name}
                placeholder="e.g. Monthly Pro"
                className="w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-aura-text mb-1.5">Price (₹)</label>
                <input
                  type="number"
                  defaultValue={editPlan?.price}
                  placeholder="2999"
                  className="w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-aura-text mb-1.5">Duration (days)</label>
                <input
                  type="number"
                  defaultValue={editPlan?.duration}
                  placeholder="30"
                  className="w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-aura-text mb-1.5">Benefits (one per line)</label>
              <textarea
                defaultValue={editPlan?.benefits.join('\n')}
                placeholder="Full gym access&#10;Locker facility&#10;Workout guidance"
                rows={4}
                className="w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => { setShowModal(false); setEditPlan(null); }}>
                Cancel
              </Button>
              <Button variant="primary">
                {editPlan ? 'Save Changes' : 'Create Plan'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
