import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Badge, Button, SearchInput } from '@/components/ui';
import { Star, Users, Clock, Plus, MessageSquare, Dumbbell } from 'lucide-react';
import type { Trainer } from '@/types';
import { motion } from 'framer-motion';

const mockTrainers: Trainer[] = [
  { id: '1', name: 'Raj Kumar', email: 'raj@gym.com', phone: '9876543210', specialization: ['Strength Training', 'HIIT', 'CrossFit'], rating: 4.9, clients: 28, workingHours: '6 AM – 2 PM', availability: true, salary: 45000, gymId: 'g1', joinedAt: '2022-03-01' },
  { id: '2', name: 'Meera Singh', email: 'meera@gym.com', phone: '9765432109', specialization: ['Yoga', 'Pilates', 'Flexibility'], rating: 4.8, clients: 22, workingHours: '8 AM – 4 PM', availability: true, salary: 40000, gymId: 'g1', joinedAt: '2022-06-15' },
  { id: '3', name: 'Arjun Das', email: 'arjun.d@gym.com', phone: '9654321098', specialization: ['Bodybuilding', 'Nutrition', 'Weight Loss'], rating: 4.7, clients: 35, workingHours: '2 PM – 10 PM', availability: false, salary: 50000, gymId: 'g1', joinedAt: '2021-11-01' },
  { id: '4', name: 'Kavya Nair', email: 'kavya@gym.com', phone: '9543210987', specialization: ['Cardio', 'Dance Fitness', 'Zumba'], rating: 4.6, clients: 18, workingHours: '6 AM – 2 PM', availability: true, salary: 38000, gymId: 'g1', joinedAt: '2023-01-10' },
  { id: '5', name: 'Vikram Patel', email: 'vikram.p@gym.com', phone: '9432109876', specialization: ['MMA', 'Boxing', 'Combat Sports'], rating: 4.8, clients: 20, workingHours: '4 PM – 10 PM', availability: true, salary: 48000, gymId: 'g1', joinedAt: '2022-08-20' },
  { id: '6', name: 'Divya Reddy', email: 'divya.r@gym.com', phone: '9321098765', specialization: ['Sports Nutrition', 'Weight Management'], rating: 4.5, clients: 15, workingHours: '10 AM – 6 PM', availability: false, salary: 42000, gymId: 'g1', joinedAt: '2023-04-05' },
];

export default function TrainersPage() {
  const [search, setSearch] = useState('');

  const filtered = mockTrainers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.specialization.some((s) => s.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Trainers' }]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Trainers</h1>
          <p className="text-sm text-aura-muted mt-0.5">{mockTrainers.length} trainers registered</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search trainers..." className="w-56" />
          <Button variant="primary">
            <Plus className="h-4 w-4" /> Add Trainer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((trainer, i) => (
          <motion.div
            key={trainer.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card hover className="group">
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-14 w-14 rounded-xl bg-aura-primary/10 flex items-center justify-center text-lg font-bold text-aura-primary border border-aura-primary/20 shrink-0">
                    {trainer.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-aura-text">{trainer.name}</h3>
                      <Badge variant={trainer.availability ? 'success' : 'muted'}>
                        {trainer.availability ? 'Available' : 'Busy'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-semibold text-aura-text">{trainer.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Specializations */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {trainer.specialization.map((s) => (
                    <span key={s} className="text-xs bg-aura-bg border border-aura-border text-aura-muted px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-aura-bg rounded-md">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Users className="h-3 w-3 text-aura-muted" />
                      <span className="text-sm font-semibold text-aura-text">{trainer.clients}</span>
                    </div>
                    <p className="text-xs text-aura-muted">Clients</p>
                  </div>
                  <div className="text-center p-2 bg-aura-bg rounded-md col-span-2">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Clock className="h-3 w-3 text-aura-muted" />
                      <span className="text-xs font-semibold text-aura-text">{trainer.workingHours}</span>
                    </div>
                    <p className="text-xs text-aura-muted">Working Hours</p>
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
        ))}
      </div>
    </DashboardLayout>
  );
}
