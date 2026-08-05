import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Badge, Button, Modal, Select } from '@/components/ui';
import { Plus, Edit, Trash2, Check, Zap, Crown, Star } from 'lucide-react';
import { formatCurrency } from '@/utils';
import type { MembershipPlan } from '@/types';
import { motion } from 'framer-motion';
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan } from '@/hooks/usePlans';

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

const PLAN_TYPE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'student', label: 'Student' },
  { value: 'premium', label: 'Premium' },
  { value: 'vip', label: 'VIP' },
];

export default function PlansPage() {
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState<MembershipPlan | null>(null);

  // React Query mutations
  const { data: plans = [], isLoading } = usePlans();
  const createMutation = useCreatePlan();
  const updateMutation = useUpdatePlan();
  const deleteMutation = useDeletePlan();

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [duration, setDuration] = useState(30);
  const [benefits, setBenefits] = useState('');
  const [type, setType] = useState<MembershipPlan['type']>('monthly');
  const [isActive, setIsActive] = useState(true);

  // Sync edit values
  useEffect(() => {
    if (editPlan) {
      setName(editPlan.name);
      setPrice(editPlan.price);
      setDuration(editPlan.duration);
      setBenefits(editPlan.benefits.join('\n'));
      setType(editPlan.type);
      setIsActive(editPlan.isActive);
    } else {
      setName('');
      setPrice(0);
      setDuration(30);
      setBenefits('');
      setType('monthly');
      setIsActive(true);
    }
  }, [editPlan, showModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const benefitList = benefits.split('\n').filter((b) => b.trim() !== '');
    const payload = {
      name: name.trim(),
      description: name.trim(),
      price: Number(price),
      durationDays: Number(duration),
      duration: Number(duration),
      features: benefitList,
      benefits: benefitList,
      type,
      isActive,
    };

    if (editPlan) {
      updateMutation.mutate(
        { id: editPlan.id, data: payload },
        {
          onSuccess: () => {
            setShowModal(false);
            setEditPlan(null);
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setShowModal(false);
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this membership plan?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Membership Plans' }]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Membership Plans</h1>
          <p className="text-sm text-aura-muted mt-0.5">{plans.length} plans available</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> Create Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 bg-white/5 animate-pulse rounded-lg border border-aura-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan, i) => {
            const planType = plan.type || 'monthly';
            const Icon = planIcons[planType] || Check;
            const color = planColors[planType] || 'text-aura-primary';
            const isPopular = planType === 'monthly' || planType === 'premium';
            const planDuration = (plan as any).durationDays ?? (plan as any).duration ?? 30;
            const benefitsList = (plan as any).benefits ?? (plan as any).features ?? [];

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
                        <button 
                          onClick={() => handleDelete(plan.id)}
                          className="p-1.5 text-aura-muted hover:text-aura-danger hover:bg-aura-danger/10 rounded-md transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-semibold text-aura-text mb-1">{plan.name}</h3>
                    <p className="text-xs text-aura-muted mb-3 capitalize">{planDuration} day{planDuration > 1 ? 's' : ''}</p>

                    <p className="text-2xl font-bold text-aura-text mb-4">
                      {formatCurrency(plan.price)}
                      <span className="text-sm text-aura-muted font-normal">
                        /{planDuration === 1 ? 'day' : planDuration <= 7 ? 'week' : 'period'}
                      </span>
                    </p>

                    <ul className="space-y-1.5 mb-4">
                      {benefitsList.map((b: string) => (
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
                      <span className="text-xs text-aura-muted capitalize">{planType}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditPlan(null); }}
        title={editPlan ? 'Edit Plan' : 'Create New Plan'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-aura-text mb-1.5">Plan Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Monthly Pro"
                className="w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-aura-text mb-1.5">Price (₹)</label>
                <input
                  type="number"
                  required
                  value={price || ''}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="2999"
                  className="w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-aura-text mb-1.5">Duration (days)</label>
                <input
                  type="number"
                  required
                  value={duration || ''}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  placeholder="30"
                  className="w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-aura-text mb-1.5">Plan Type</label>
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  options={PLAN_TYPE_OPTIONS}
                  className="text-xs h-10 bg-aura-bg"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-aura-text mb-1.5">Benefits (one per line)</label>
              <textarea
                required
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                placeholder="Full gym access&#10;Locker facility&#10;Group classes"
                rows={4}
                className="w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditPlan(null); }}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={createMutation.isPending || updateMutation.isPending}>
                {editPlan ? 'Save Changes' : 'Create Plan'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
