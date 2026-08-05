import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Badge, Button, SearchInput, StatCard, Modal, Input, Select } from '@/components/ui';
import { Wrench, Plus, AlertTriangle, CheckCircle, Calendar, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { formatDate, safeNewDate, uploadFileToGallery } from '@/utils';
import { motion } from 'framer-motion';
import { useEquipment, useCreateEquipment, useDeleteEquipment } from '@/hooks/useEquipment';
import { toast } from 'sonner';

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

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Strength');
  const [condition, setCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');
  const [status, setStatus] = useState<'operational' | 'maintenance' | 'retired'>('operational');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: equipment = [], isLoading } = useEquipment();
  const createMutation = useCreateEquipment();
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
      toast.success('Equipment photo uploaded to Supabase.');
    } catch {
      toast.error('Image upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createMutation.mutate(
      {
        name: name.trim(),
        category,
        condition,
        status,
        imageUrl: imageUrl.trim() || undefined,
      },
      {
        onSuccess: () => {
          setShowAddModal(false);
          setName('');
          setCategory('Strength');
          setCondition('excellent');
          setStatus('operational');
          setImageUrl('');
        },
      }
    );
  };

  const stats = [
    { title: 'Total Equipment', value: (equipment || []).length, icon: Wrench, iconColor: 'text-aura-primary' },
    { title: 'Needs Service', value: (equipment || []).filter((e) => e.condition === 'maintenance').length, icon: AlertTriangle, iconColor: 'text-aura-danger' },
    { title: 'Service Due Soon', value: (equipment || []).filter((e) => { const days = (safeNewDate(e.nextService || new Date()).getTime() - Date.now()) / (1000 * 3600 * 24); return days <= 14 && days >= 0; }).length, icon: Calendar, iconColor: 'text-aura-warning' },
    { title: 'Excellent Condition', value: (equipment || []).filter((e) => e.condition === 'excellent').length, icon: CheckCircle, iconColor: 'text-aura-success' },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Equipment' }]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Equipment</h1>
          <p className="text-sm text-aura-muted mt-0.5">Track gym machinery and maintenance logs</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)} className="gap-2">
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
                {['Equipment Name', 'Category', 'Condition', 'Usage', 'Next Service', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold text-aura-muted uppercase tracking-wider first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-border">
              {filtered.map((eq, i) => {
                const img = (eq as any).imageUrl || (eq as any).image_url;
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
                          <img src={img} alt={eq.name} className="h-9 w-9 rounded-md object-cover border border-aura-border shrink-0" />
                        ) : (
                          <div className="h-9 w-9 rounded-md bg-aura-primary/10 flex items-center justify-center border border-aura-primary/20 shrink-0">
                            <Wrench className="h-4 w-4 text-aura-primary" />
                          </div>
                        )}
                        <span className="font-medium text-aura-text">{eq.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-aura-muted">{eq.category}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={conditionVariantMap[eq.condition] ?? 'muted'} className="capitalize">
                        {eq.condition}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-aura-text">{(eq.usageHours || 0).toLocaleString()} hrs</td>
                    <td className="px-4 py-3.5 text-aura-muted text-xs">{formatDate(eq.nextService || new Date())}</td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => deleteMutation.mutate(eq.id)}
                        className="p-1.5 text-aura-muted hover:text-aura-danger rounded-md hover:bg-aura-danger/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add Equipment Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Gym Equipment">
        <form onSubmit={handleAddEquipment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Equipment Name *</label>
            <Input
              type="text"
              required
              placeholder="e.g. Olympic Barbell 20kg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-aura-text mb-1">Category *</label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-xs"
                options={[
                  { value: 'Strength', label: 'Strength' },
                  { value: 'Cardio', label: 'Cardio' },
                  { value: 'Free Weights', label: 'Free Weights' },
                  { value: 'Accessories', label: 'Accessories' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-aura-text mb-1">Condition *</label>
              <Select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="text-xs"
                options={[
                  { value: 'excellent', label: 'Excellent' },
                  { value: 'good', label: 'Good' },
                  { value: 'fair', label: 'Fair' },
                  { value: 'poor', label: 'Poor' },
                ]}
              />
            </div>
          </div>

          {/* Photo Upload Input */}
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Equipment Photo (Upload to Supabase)</label>
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="h-12 w-12 rounded-md object-cover border border-aura-border" />
              ) : (
                <div className="h-12 w-12 rounded-md bg-aura-card border border-aura-border flex items-center justify-center text-aura-muted">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
              <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-aura-border rounded-md p-2.5 cursor-pointer hover:border-aura-primary/50 transition-colors text-xs text-aura-muted">
                <Upload className="h-4 w-4 text-aura-primary" />
                <span>{isUploading ? 'Uploading to Supabase...' : imageUrl ? 'Change Photo' : 'Upload Equipment Photo'}</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isUploading}>
              Register Equipment
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
