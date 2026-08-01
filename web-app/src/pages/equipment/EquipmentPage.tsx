import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Badge, Button, SearchInput, StatCard } from '@/components/ui';
import { Wrench, Plus, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { formatDate } from '@/utils';
import type { Equipment } from '@/types';
import { EQUIPMENT_CONDITION_COLORS } from '@/constants';
import { motion } from 'framer-motion';

const mockEquipment: Equipment[] = [
  { id: '1', name: 'Treadmill #1', category: 'Cardio', condition: 'excellent', purchaseDate: '2023-01-15', warrantyExpiry: '2026-01-15', nextService: new Date(Date.now() + 30 * 24 * 3600000).toISOString(), usageHours: 1240, gymId: 'g1', serviceHistory: [] },
  { id: '2', name: 'Treadmill #2', category: 'Cardio', condition: 'good', purchaseDate: '2022-06-01', warrantyExpiry: '2025-06-01', nextService: new Date(Date.now() + 15 * 24 * 3600000).toISOString(), usageHours: 2180, gymId: 'g1', serviceHistory: [] },
  { id: '3', name: 'Treadmill #3', category: 'Cardio', condition: 'maintenance', purchaseDate: '2021-11-20', warrantyExpiry: '2024-11-20', nextService: new Date(Date.now() - 2 * 24 * 3600000).toISOString(), usageHours: 3450, gymId: 'g1', serviceHistory: [] },
  { id: '4', name: 'Elliptical #1', category: 'Cardio', condition: 'good', purchaseDate: '2023-03-10', warrantyExpiry: '2026-03-10', nextService: new Date(Date.now() + 45 * 24 * 3600000).toISOString(), usageHours: 890, gymId: 'g1', serviceHistory: [] },
  { id: '5', name: 'Bench Press Station', category: 'Strength', condition: 'excellent', purchaseDate: '2023-07-01', warrantyExpiry: '2026-07-01', nextService: new Date(Date.now() + 60 * 24 * 3600000).toISOString(), usageHours: 540, gymId: 'g1', serviceHistory: [] },
  { id: '6', name: 'Cable Machine', category: 'Strength', condition: 'fair', purchaseDate: '2021-05-15', warrantyExpiry: '2024-05-15', nextService: new Date(Date.now() + 5 * 24 * 3600000).toISOString(), usageHours: 4200, gymId: 'g1', serviceHistory: [] },
  { id: '7', name: 'Rowing Machine', category: 'Cardio', condition: 'good', purchaseDate: '2022-09-01', warrantyExpiry: '2025-09-01', nextService: new Date(Date.now() + 20 * 24 * 3600000).toISOString(), usageHours: 1680, gymId: 'g1', serviceHistory: [] },
  { id: '8', name: 'Power Rack', category: 'Strength', condition: 'excellent', purchaseDate: '2023-02-20', warrantyExpiry: '2028-02-20', nextService: new Date(Date.now() + 90 * 24 * 3600000).toISOString(), usageHours: 320, gymId: 'g1', serviceHistory: [] },
];

const conditionVariantMap: Record<string, 'success' | 'default' | 'warning' | 'danger' | 'muted'> = {
  excellent: 'success',
  good: 'default',
  fair: 'warning',
  poor: 'danger',
  maintenance: 'muted',
};

const stats = [
  { title: 'Total Equipment', value: mockEquipment.length, icon: Wrench, iconColor: 'text-aura-primary' },
  { title: 'Needs Service', value: mockEquipment.filter((e) => e.condition === 'maintenance').length, icon: AlertTriangle, iconColor: 'text-aura-danger' },
  { title: 'Service Due Soon', value: mockEquipment.filter((e) => { const days = (new Date(e.nextService).getTime() - Date.now()) / (1000 * 3600 * 24); return days <= 14 && days >= 0; }).length, icon: Calendar, iconColor: 'text-aura-warning' },
  { title: 'Excellent Condition', value: mockEquipment.filter((e) => e.condition === 'excellent').length, icon: CheckCircle, iconColor: 'text-aura-success' },
];

export default function EquipmentPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(mockEquipment.map((e) => e.category)))];
  const filtered = mockEquipment.filter((e) => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== 'All' && e.category !== category) return false;
    return true;
  });

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Equipment' }]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Equipment</h1>
          <p className="text-sm text-aura-muted mt-0.5">Track gym equipment and maintenance</p>
        </div>
        <Button variant="primary">
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
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                category === cat ? 'bg-aura-primary text-aura-bg' : 'text-aura-muted hover:text-aura-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Equipment', 'Category', 'Condition', 'Usage Hours', 'Next Service', 'Warranty', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-aura-muted uppercase tracking-wider first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-border">
              {filtered.map((eq, i) => {
                const daysToService = Math.round((new Date(eq.nextService).getTime() - Date.now()) / (1000 * 3600 * 24));
                return (
                  <motion.tr
                    key={eq.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-white/3 transition-colors"
                  >
                    <td className="px-4 py-3.5 pl-6">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-md bg-aura-primary/10 flex items-center justify-center border border-aura-primary/20">
                          <Wrench className="h-4 w-4 text-aura-primary" />
                        </div>
                        <span className="font-medium text-aura-text">{eq.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-aura-muted">{eq.category}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={conditionVariantMap[eq.condition] ?? 'muted'} className="capitalize">
                        {eq.condition}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-aura-text">{eq.usageHours.toLocaleString()} hrs</td>
                    <td className="px-4 py-3.5">
                      <div className={daysToService <= 0 ? 'text-aura-danger' : daysToService <= 14 ? 'text-aura-warning' : 'text-aura-text'}>
                        {daysToService <= 0 ? 'Overdue' : `${daysToService}d`}
                        <div className="text-xs text-aura-muted mt-0.5">{formatDate(eq.nextService)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-aura-muted text-xs">{formatDate(eq.warrantyExpiry)}</td>
                    <td className="px-4 py-3.5">
                      <button className="text-xs text-aura-primary hover:underline">Schedule Service</button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
