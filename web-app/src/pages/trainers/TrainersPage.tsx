import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Badge, Button, SearchInput, Modal, Input } from '@/components/ui';
import { Star, Users, Clock, Plus, MessageSquare, Dumbbell, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTrainers, useCreateTrainer, useDeleteTrainer } from '@/hooks/useTrainers';

export default function TrainersPage() {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('Strength & Conditioning');

  const { data: trainers = [], isLoading } = useTrainers();
  const createMutation = useCreateTrainer();
  const deleteMutation = useDeleteTrainer();

  const filtered = (trainers || []).filter((t) => {
    const name = t.name || (t as any).full_name || 'Trainer';
    const specs = Array.isArray(t.specialization) 
      ? t.specialization 
      : typeof (t as any).specialization === 'string' 
        ? [(t as any).specialization] 
        : [];
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      specs.some((s) => s.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const handleAddTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    createMutation.mutate(
      {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        specialization: specialization.trim(),
      },
      {
        onSuccess: () => {
          setShowAddModal(false);
          setFullName('');
          setEmail('');
          setPhone('');
          setSpecialization('Strength & Conditioning');
        },
      }
    );
  };

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Trainers' }]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Trainers</h1>
          <p className="text-sm text-aura-muted mt-0.5">{trainers.length} trainers registered</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search trainers..." className="w-56" />
          <Button variant="primary" onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Trainer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((trainer, i) => {
          const name = trainer.name || (trainer as any).full_name || 'Trainer';
          const specs = Array.isArray(trainer.specialization) 
            ? trainer.specialization 
            : typeof (trainer as any).specialization === 'string' 
              ? (trainer as any).specialization.split(',') 
              : ['General Fitness'];
          return (
            <motion.div
              key={trainer.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card hover className="group relative">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-14 w-14 rounded-xl bg-aura-primary/10 flex items-center justify-center text-lg font-bold text-aura-primary border border-aura-primary/20 shrink-0">
                      {name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-aura-text">{name}</h3>
                        <button
                          onClick={() => deleteMutation.mutate(trainer.id)}
                          className="p-1 text-aura-muted hover:text-aura-danger rounded hover:bg-aura-danger/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-semibold text-aura-text">{trainer.rating || 4.8}</span>
                      </div>
                    </div>
                  </div>

                  {/* Specializations */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-4">
                    {specs.map((s: string) => (
                      <Badge key={s} variant="muted" className="text-xs">
                        {s.trim()}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 py-3 px-3 bg-aura-bg rounded-lg border border-aura-border text-xs mb-4">
                    <div>
                      <span className="text-aura-muted block">Active Clients</span>
                      <span className="font-semibold text-aura-text">{trainer.clients || 0} members</span>
                    </div>
                    <div>
                      <span className="text-aura-muted block">Schedule</span>
                      <span className="font-semibold text-aura-text">{trainer.workingHours || 'Flexible'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1.5 bg-aura-bg border border-aura-border text-aura-muted text-xs font-medium py-2 rounded-md hover:text-aura-text hover:border-aura-primary/50 transition-colors">
                      <Dumbbell className="h-3.5 w-3.5" />
                      Assign Members
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 bg-aura-primary/10 text-aura-primary text-xs font-medium py-2 rounded-md hover:bg-aura-primary/20 transition-colors border border-aura-primary/20">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Message
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Add Trainer Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Register Personal Trainer">
        <form onSubmit={handleAddTrainer} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Trainer Full Name *</label>
            <Input
              type="text"
              required
              placeholder="e.g. Coach Arnold"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-aura-text mb-1">Email Address *</label>
              <Input
                type="email"
                required
                placeholder="e.g. arnold@gym.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-aura-text mb-1">Phone Number</label>
              <Input
                type="text"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Specializations *</label>
            <Input
              type="text"
              required
              placeholder="e.g. Powerlifting, Strength & Conditioning"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register Trainer
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
