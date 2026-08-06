import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Badge, Button, SearchInput, StatCard, Modal, Input, Select } from '@/components/ui';
import { Wrench, Plus, AlertTriangle, CheckCircle, Calendar, Trash2, Upload, Image as ImageIcon, Edit3 } from 'lucide-react';
import { formatDate, safeNewDate, uploadFileToGallery } from '@/utils';
import { motion } from 'framer-motion';
import { useEquipment, useCreateEquipment, useUpdateEquipment, useDeleteEquipment } from '@/hooks/useEquipment';
import { toast } from 'sonner';
import type { Equipment } from '@/types';

const conditionVariantMap: Record<string, 'success' | 'default' | 'warning' | 'danger' | 'muted'> = {
  excellent: 'success',
  good: 'default',
  fair: 'warning',
  poor: 'danger',
  maintenance: 'muted',
};

export default function EquipmentPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  // Form states (Add/Edit)
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Strength');
  const [condition, setCondition] = useState<'excellent' | 'good' | 'fair' | 'poor' | 'maintenance'>('excellent');
  const [status, setStatus] = useState<'operational' | 'maintenance' | 'retired'>('operational');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: equipment = [], isLoading } = useEquipment();
  const createMutation = useCreateEquipment();
  const updateMutation = useUpdateEquipment();
  const deleteMutation = useDeleteEquipment();

  const categories = ['All', ...Array.from(new Set((equipment || []).map((e) => e.category || 'General')))];

  const filtered = (equipment || []).filter((e) => {
    const eqName = e.name || 'Equipment';
    const eqCat = e.category || 'General';
    if (search && !eqName.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== 'All' && eqCat !== categoryFilter) return false;
    return true;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFileToGallery({
        file,
        entityType: 'equipment',
        caption: `Equipment Photo: ${name || 'Item'}`,
      });
      setImageUrl(url);
      toast.success('Equipment photo uploaded successfully.');
    } catch {
      toast.error('Image upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const openAddModal = () => {
    setEditingEquipment(null);
    setName('');
    setCategory('Strength');
    setCondition('excellent');
    setStatus('operational');
    setImageUrl('');
    setShowAddModal(true);
  };

  const openEditModal = (eq: Equipment) => {
    setEditingEquipment(eq);
    setName(eq.name || '');
    setCategory(eq.category || 'Strength');
    setCondition((eq.condition as any) || 'excellent');
    setStatus((eq.status as any) || 'operational');
    setImageUrl(eq.imageUrl || '');
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      category,
      condition,
      status,
      imageUrl: imageUrl.trim() || undefined,
    };

    if (editingEquipment) {
      updateMutation.mutate(
        { id: editingEquipment.id, data: payload },
        {
          onSuccess: () => {
            setShowAddModal(false);
            setEditingEquipment(null);
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setShowAddModal(false);
        },
      });
    }
  };

  const stats = [
    { title: 'Total Equipment', value: (equipment || []).length, icon: Wrench, iconColor: 'text-aura-primary' },
    { title: 'Operational Items', value: (equipment || []).filter((e) => (e.status || 'operational') === 'operational').length, icon: CheckCircle, iconColor: 'text-aura-success' },
    { title: 'Needs Maintenance', value: (equipment || []).filter((e) => e.condition === 'poor' || e.status === 'maintenance').length, icon: AlertTriangle, iconColor: 'text-aura-danger' },
    { title: 'Excellent Condition', value: (equipment || []).filter((e) => e.condition === 'excellent').length, icon: CheckCircle, iconColor: 'text-aura-primary' },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Equipment' }]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Equipment</h1>
          <p className="text-sm text-aura-muted mt-0.5">Track gym machinery, photos, and maintenance logs</p>
        </div>
        <Button variant="primary" onClick={openAddModal} className="gap-2">
          <Plus className="h-4 w-4" /> Add Equipment
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <StatCard key={s.title} {...s} index={i} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search equipment..." className="w-56" />
        <div className="flex gap-1 bg-aura-card border border-aura-border rounded-md p-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                categoryFilter === cat ? 'bg-aura-primary text-aura-bg' : 'text-aura-muted hover:text-aura-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-aura-border text-left">
                {['Equipment Name', 'Category', 'Condition', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold text-aura-muted uppercase tracking-wider first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-border">
              {filtered.map((eq, i) => {
                const img = eq.imageUrl || (eq as any).image_url || (eq as any).path;
                return (
                  <motion.tr
                    key={eq.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-white/3 transition-colors"
                  >
                    <td className="px-4 py-3.5 pl-6">
                      <div className="flex items-center gap-3">
                        {img ? (
                          <img
                            src={img}
                            alt={eq.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=200&q=80';
                            }}
                            className="h-10 w-10 rounded-md object-cover border border-aura-border shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-aura-primary/10 flex items-center justify-center border border-aura-primary/20 shrink-0">
                            <Wrench className="h-5 w-5 text-aura-primary" />
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-aura-text block">{eq.name}</span>
                          <span className="text-xs text-aura-muted capitalize">{eq.description || 'Gym Facility Equipment'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-aura-muted font-medium">{eq.category}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={conditionVariantMap[eq.condition] ?? 'muted'} className="capitalize font-bold">
                        {eq.condition}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={eq.status === 'operational' ? 'success' : eq.status === 'maintenance' ? 'warning' : 'danger'} className="capitalize font-bold">
                        {eq.status || 'operational'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(eq)}
                          className="p-1.5 text-aura-muted hover:text-aura-primary rounded-md hover:bg-aura-primary/10 transition-colors"
                          title="Edit Equipment"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(eq.id)}
                          className="p-1.5 text-aura-muted hover:text-aura-danger rounded-md hover:bg-aura-danger/10 transition-colors"
                          title="Delete Equipment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add / Edit Equipment Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingEquipment ? 'Edit Gym Equipment' : 'Add Gym Equipment'}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-[#12151b]">
          <div>
            <label className="block text-xs font-semibold text-aura-text uppercase tracking-wider mb-2">
              Equipment Name *
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Leg Press 3 in 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm bg-[#0a0c0f] border-aura-border/80 focus:border-aura-primary focus:ring-aura-primary/30 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-aura-text uppercase tracking-wider mb-2">
                Category *
              </label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-sm bg-[#0a0c0f] border-aura-border/80 focus:border-aura-primary focus:ring-aura-primary/30 rounded-xl"
                options={[
                  { value: 'Strength', label: 'Strength' },
                  { value: 'Cardio', label: 'Cardio' },
                  { value: 'Free Weights', label: 'Free Weights' },
                  { value: 'Accessories', label: 'Accessories' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-aura-text uppercase tracking-wider mb-2">
                Condition *
              </label>
              <Select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="text-sm bg-[#0a0c0f] border-aura-border/80 focus:border-aura-primary focus:ring-aura-primary/30 rounded-xl"
                options={[
                  { value: 'excellent', label: 'Excellent' },
                  { value: 'good', label: 'Good' },
                  { value: 'fair', label: 'Fair' },
                  { value: 'poor', label: 'Poor' },
                  { value: 'maintenance', label: 'Maintenance' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-aura-text uppercase tracking-wider mb-2">
              Operational Status
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="text-sm bg-[#0a0c0f] border-aura-border/80 focus:border-aura-primary focus:ring-aura-primary/30 rounded-xl"
              options={[
                { value: 'operational', label: 'Operational' },
                { value: 'maintenance', label: 'In Maintenance' },
                { value: 'retired', label: 'Retired / Out of Order' },
              ]}
            />
          </div>

          {/* Photo Upload Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-aura-text uppercase tracking-wider mb-2">
              Equipment Photo
            </label>
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-14 w-14 rounded-xl object-cover border-2 border-aura-primary/40 shadow-sm shrink-0"
                />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-[#0a0c0f] border border-aura-border/80 flex items-center justify-center text-aura-muted shrink-0">
                  <ImageIcon className="h-6 w-6 text-aura-primary/70" />
                </div>
              )}
              <label className="flex-1 flex items-center justify-center gap-2.5 bg-[#0a0c0f] border-2 border-dashed border-aura-border/80 hover:border-aura-primary/60 rounded-xl p-3.5 cursor-pointer transition-all hover:bg-white/[0.02] group">
                <Upload className="h-4 w-4 text-aura-primary group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-aura-text">
                  {isUploading ? 'Uploading to Supabase Storage...' : imageUrl ? 'Change Photo' : 'Upload Equipment Photo'}
                </span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-3 pt-3 border-t border-aura-border/50">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2.5 rounded-xl border border-aura-border bg-white/5 hover:bg-white/10 text-aura-text text-sm font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || createMutation.isPending || updateMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-aura-primary text-aura-bg hover:bg-aura-primary/90 text-sm font-bold shadow-aura-sm transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {editingEquipment ? 'Save Changes' : 'Register Equipment'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
