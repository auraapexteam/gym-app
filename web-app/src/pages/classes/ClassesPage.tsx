import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Badge, Button, StatCard } from '@/components/ui';
import { Calendar, Users, Clock, Plus, Dumbbell } from 'lucide-react';
import type { GymClass } from '@/types';
import { formatDate } from '@/utils';
import { motion } from 'framer-motion';

export default function ClassesPage() {
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [view, setView] = useState<'grid' | 'calendar'>('grid');

  const stats = [
    { title: "Today's Classes", value: classes.length, icon: Calendar, iconColor: 'text-aura-primary' },
    { title: 'Total Enrolled', value: classes.reduce((a, c) => a + c.enrolled, 0), icon: Users, iconColor: 'text-blue-400' },
    { title: 'Avg Fill Rate', value: `${classes.length ? Math.round(classes.reduce((a, c) => a + (c.enrolled / c.capacity) * 100, 0) / classes.length) : 0}%`, icon: Dumbbell, iconColor: 'text-aura-success' },
    { title: 'Waiting List', value: classes.reduce((a, c) => a + c.waitingList, 0), icon: Clock, iconColor: 'text-aura-warning' },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Classes' }]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Classes</h1>
          <p className="text-sm text-aura-muted mt-0.5">Manage gym class schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-aura-card border border-aura-border rounded-md p-1">
            {['grid', 'calendar'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded capitalize transition-colors ${
                  view === v ? 'bg-aura-primary text-aura-bg' : 'text-aura-muted hover:text-aura-text'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <Button variant="primary">
            <Plus className="h-4 w-4" /> Create Class
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatCard key={s.title} {...s} index={i} />)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls, i) => {
          const fillRate = Math.round((cls.enrolled / cls.capacity) * 100);
          const isFull = cls.enrolled >= cls.capacity;
          return (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card hover>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-aura-text">{cls.name}</h3>
                      <p className="text-xs text-aura-muted mt-0.5 flex items-center gap-1">
                        <Dumbbell className="h-3 w-3" />
                        {cls.trainerName}
                      </p>
                    </div>
                    <Badge variant={isFull ? 'danger' : 'success'}>
                      {isFull ? 'Full' : 'Open'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-aura-bg rounded-md p-2">
                      <p className="text-sm font-bold text-aura-text">{cls.schedule}</p>
                      <p className="text-xs text-aura-muted">Time</p>
                    </div>
                    <div className="bg-aura-bg rounded-md p-2">
                      <p className="text-sm font-bold text-aura-text">{cls.duration}m</p>
                      <p className="text-xs text-aura-muted">Duration</p>
                    </div>
                    <div className="bg-aura-bg rounded-md p-2">
                      <p className="text-sm font-bold text-aura-text">{cls.enrolled}/{cls.capacity}</p>
                      <p className="text-xs text-aura-muted">Members</p>
                    </div>
                  </div>

                  {/* Fill bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-aura-muted mb-1">
                      <span>Fill Rate</span>
                      <span className={fillRate >= 100 ? 'text-aura-danger' : fillRate >= 80 ? 'text-aura-warning' : 'text-aura-success'}>
                        {fillRate}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-aura-bg rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${fillRate >= 100 ? 'bg-aura-danger' : fillRate >= 80 ? 'bg-aura-warning' : 'bg-aura-primary'}`}
                        style={{ width: `${Math.min(fillRate, 100)}%` }}
                      />
                    </div>
                  </div>

                  {cls.waitingList > 0 && (
                    <p className="text-xs text-aura-warning mb-3">
                      +{cls.waitingList} on waiting list
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button className="flex-1 py-1.5 text-xs font-medium text-aura-muted border border-aura-border rounded-md hover:text-aura-text hover:border-aura-primary/50 transition-colors">
                      Manage
                    </button>
                    <button className="flex-1 py-1.5 text-xs font-medium text-aura-primary bg-aura-primary/10 border border-aura-primary/20 rounded-md hover:bg-aura-primary/20 transition-colors">
                      Attendance
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
