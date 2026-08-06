import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { progressApi } from '@/api/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Scale, Droplet, Flame, Plus, Calendar, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerProgressPage() {
  const qc = useQueryClient();
  const [weightKg, setWeightKg] = useState('');
  const [waterLiters, setWaterLiters] = useState('');
  const [proteinGrams, setProteinGrams] = useState('');
  const todayStr = new Date().toISOString().split('T')[0];

  const { data: monthSummary = [], isLoading } = useQuery({
    queryKey: ['progress-month'],
    queryFn: async () => {
      const res = await progressApi.getMonthSummary();
      return Array.isArray(res.data.data) ? res.data.data : [];
    },
  });

  const weightMutation = useMutation({
    mutationFn: (val: number) => progressApi.logWeight({ date: todayStr, weightKg: val }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress-month'] });
      setWeightKg('');
      toast.success('Body weight logged successfully!');
    },
    onError: () => toast.error('Failed to log weight.'),
  });

  const waterMutation = useMutation({
    mutationFn: (val: number) => progressApi.logWater({ date: todayStr, amountLiters: val }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress-month'] });
      setWaterLiters('');
      toast.success('Water intake logged successfully!');
    },
    onError: () => toast.error('Failed to log water intake.'),
  });

  const proteinMutation = useMutation({
    mutationFn: (val: number) => progressApi.logProtein({ date: todayStr, amountGrams: val }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress-month'] });
      setProteinGrams('');
      toast.success('Protein intake logged successfully!');
    },
    onError: () => toast.error('Failed to log protein intake.'),
  });

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Customer Portal', href: '/dashboard' }, { label: 'Fitness Progress' }]}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-aura-card border border-aura-border p-6 rounded-2xl">
          <div>
            <h1 className="text-2xl font-bold text-aura-text">Personal Fitness & Body Logbook</h1>
            <p className="text-sm text-aura-muted mt-1">Track your daily body weight, hydration, and nutrition goals</p>
          </div>
          <Badge variant="success" className="gap-1 text-xs">
            <Calendar className="h-3.5 w-3.5" /> Today: {todayStr}
          </Badge>
        </div>

        {/* Quick Log Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weight */}
          <Card className="hover:border-aura-primary/40 transition-colors">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Scale className="h-5 w-5 text-aura-primary" /> Body Weight (kg)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-3">
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 72.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full bg-aura-bg border border-aura-border rounded-lg px-3 py-2 text-sm text-aura-text focus:outline-none focus:border-aura-primary"
              />
              <Button
                variant="primary"
                size="sm"
                disabled={!weightKg || weightMutation.isPending}
                onClick={() => weightMutation.mutate(parseFloat(weightKg))}
                className="w-full gap-1.5 text-xs font-semibold"
              >
                <Plus className="h-4 w-4" /> Log Weight
              </Button>
            </CardContent>
          </Card>

          {/* Water */}
          <Card className="hover:border-blue-400/40 transition-colors">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Droplet className="h-5 w-5 text-blue-400" /> Daily Water (Liters)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-3">
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 3.5"
                value={waterLiters}
                onChange={(e) => setWaterLiters(e.target.value)}
                className="w-full bg-aura-bg border border-aura-border rounded-lg px-3 py-2 text-sm text-aura-text focus:outline-none focus:border-blue-400"
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={!waterLiters || waterMutation.isPending}
                onClick={() => waterMutation.mutate(parseFloat(waterLiters))}
                className="w-full gap-1.5 text-xs font-semibold"
              >
                <Plus className="h-4 w-4" /> Log Water
              </Button>
            </CardContent>
          </Card>

          {/* Protein */}
          <Card className="hover:border-amber-400/40 transition-colors">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Flame className="h-5 w-5 text-amber-400" /> Daily Protein (Grams)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-3">
              <input
                type="number"
                placeholder="e.g. 140"
                value={proteinGrams}
                onChange={(e) => setProteinGrams(e.target.value)}
                className="w-full bg-aura-bg border border-aura-border rounded-lg px-3 py-2 text-sm text-aura-text focus:outline-none focus:border-amber-400"
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={!proteinGrams || proteinMutation.isPending}
                onClick={() => proteinMutation.mutate(parseInt(proteinGrams, 10))}
                className="w-full gap-1.5 text-xs font-semibold"
              >
                <Plus className="h-4 w-4" /> Log Protein
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Logbook Summary Table */}
        <Card>
          <CardHeader className="p-6 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-aura-primary" /> Monthly Logbook Progress History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {monthSummary.length === 0 ? (
              <div className="text-center py-10 text-aura-muted text-xs border border-dashed border-aura-border rounded-xl">
                No progress logs recorded for this month yet. Use the cards above to log your daily body weight, hydration, and protein intake!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-aura-border text-left">
                      {['Logged Date', 'Weight (kg)', 'Water (Liters)', 'Protein (Grams)', 'Status'].map((h) => (
                        <th key={h} className="pb-3 font-semibold text-aura-muted uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-aura-border">
                    {monthSummary.map((item) => (
                      <tr key={item.date} className="hover:bg-white/3">
                        <td className="py-3 font-semibold text-aura-text">{item.date}</td>
                        <td className="py-3 text-aura-primary font-bold">{item.weightKg ? `${item.weightKg} kg` : '—'}</td>
                        <td className="py-3 text-blue-400 font-bold">{item.waterLiters ? `${item.waterLiters} L` : '—'}</td>
                        <td className="py-3 text-amber-400 font-bold">{item.proteinGrams ? `${item.proteinGrams} g` : '—'}</td>
                        <td className="py-3">
                          <Badge variant="success" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Logged
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
