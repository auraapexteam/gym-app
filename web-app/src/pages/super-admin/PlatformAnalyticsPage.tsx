import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { useAdminGyms } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, Select } from '@/components/ui';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { BarChart3, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

const COLORS = ['#22C55E', '#3B82F6', '#F97316', '#EF4444'];

export default function PlatformAnalyticsPage() {
  const { data: gyms = [] } = useAdminGyms();
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  // Compute statistics
  const totalRevenue = gyms.reduce((acc, curr) => acc + curr.monthlyRevenue, 0);
  const activeGymsCount = gyms.filter(g => g.status === 'active').length;
  const totalMembers = gyms.reduce((acc, curr) => acc + curr.totalMembers, 0);
  
  // Calculate average gyms size
  const averageGymSize = activeGymsCount ? Math.round(totalMembers / activeGymsCount) : 0;

  // Prepare Branch Performance Data
  const branchPerformanceData = gyms.map((gym) => ({
    name: gym.name.replace('Aura Apex Fitness — ', ''),
    revenue: gym.monthlyRevenue,
    members: gym.totalMembers,
  })).sort((a, b) => b.revenue - a.revenue);

  // Prepare Status Distribution Data
  const statusCounts = gyms.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusDistributionData = [
    { name: 'Active', value: statusCounts['active'] || 0 },
    { name: 'Pending', value: statusCounts['pending'] || 0 },
    { name: 'Suspended', value: statusCounts['suspended'] || 0 },
    { name: 'Expired', value: statusCounts['expired'] || 0 },
  ].filter(item => item.value > 0);

  // Platform growth trend mock data
  const growthTrendData = [
    { month: 'Feb', revenue: 680000, target: 700000, subCount: 4 },
    { month: 'Mar', revenue: 840000, target: 800000, subCount: 5 },
    { month: 'Apr', revenue: 980000, target: 900000, subCount: 5 },
    { month: 'May', revenue: 1150000, target: 1100000, subCount: 6 },
    { month: 'Jun', revenue: 1280000, target: 1250000, subCount: 7 },
    { month: 'Jul', revenue: totalRevenue, target: totalRevenue - 50000, subCount: gyms.length },
  ];

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Super Admin' }, { label: 'Platform Analytics' }]}>
      
      {/* 1. Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-aura-text flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-aura-primary" /> Platform-Wide Analytics
          </h1>
          <p className="text-aura-muted text-sm mt-1">
            Real-time platform financial trends, subscription distributions, and branch matrices
          </p>
        </div>
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="w-full sm:w-40 text-xs bg-aura-bg"
          options={[
            { value: 'month', label: 'This Month' },
            { value: 'quarter', label: 'This Quarter' },
            { value: 'year', label: 'This Year' }
          ]}
        />
      </div>

      {/* 2. Statistical Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-aura-card border-aura-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 bg-aura-primary/10 rounded-lg flex items-center justify-center text-aura-primary">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-aura-muted font-medium uppercase tracking-wider block">Total Platform MRR</span>
              <span className="text-2xl font-bold text-aura-text">₹{(totalRevenue / 100000).toFixed(2)}L</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-aura-card border-aura-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 bg-aura-success/10 rounded-lg flex items-center justify-center text-aura-success">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-aura-muted font-medium uppercase tracking-wider block">Active Accounts</span>
              <span className="text-2xl font-bold text-aura-text">{activeGymsCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-aura-card border-aura-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 bg-aura-info/10 rounded-lg flex items-center justify-center text-aura-info">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-aura-muted font-medium uppercase tracking-wider block">Total Users Tracked</span>
              <span className="text-2xl font-bold text-aura-text">{totalMembers.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-aura-card border-aura-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 bg-white/5 rounded-lg flex items-center justify-center text-aura-text">
              <TrendingUp className="h-5 w-5 text-aura-primary" />
            </div>
            <div>
              <span className="text-xs text-aura-muted font-medium uppercase tracking-wider block">Avg Branch Size</span>
              <span className="text-2xl font-bold text-aura-text">{averageGymSize} members</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Charts Row 1: Platform Revenue Trend & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Platform Revenue Trend */}
        <Card className="bg-aura-card border-aura-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-aura-text">Platform Revenue growth & Target Mapping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C6FF00" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#C6FF00" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <YAxis 
                    stroke="#9CA3AF" 
                    fontSize={11} 
                    tickLine={false} 
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} 
                  />
                  <Tooltip
                    contentStyle={{ background: '#1B1D22', borderColor: '#2A2D35', borderRadius: '8px' }}
                    labelStyle={{ color: '#9CA3AF', fontSize: '11px' }}
                    itemStyle={{ fontSize: '12px' }}
                    formatter={(value: any, name: any) => [
                      `₹${(value / 100000).toFixed(2)}L`, 
                      name === 'revenue' ? 'Actual MRR' : 'Target MRR'
                    ]}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Area 
                    name="revenue" 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#C6FF00" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#revenueGrad)" 
                  />
                  <Area 
                    name="target" 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#3B82F6" 
                    strokeWidth={1.5} 
                    strokeDasharray="4 4" 
                    fillOpacity={1} 
                    fill="url(#targetGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status distribution */}
        <Card className="bg-aura-card border-aura-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-aura-text">Subscription Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1B1D22', borderColor: '#2A2D35', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px', color: '#FFFFFF' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <span className="text-[10px] text-aura-muted uppercase tracking-wider block">Integrations</span>
                <span className="text-2xl font-bold text-aura-text">{gyms.length}</span>
              </div>
            </div>
            
            {/* Custom status legend */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-xs">
              {statusDistributionData.map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-aura-muted">{entry.name}:</span>
                  <span className="font-bold text-aura-text">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Charts Row 2: Branch Comparison (Revenue and Members) */}
      <Card className="bg-aura-card border-aura-border mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-aura-text">Branch Matrix comparison (Revenue & Members Capacity)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchPerformanceData} margin={{ top: 10, right: 10, left: 0, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF" 
                  fontSize={10} 
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#9CA3AF" 
                  fontSize={10} 
                  tickLine={false} 
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} 
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#9CA3AF" 
                  fontSize={10} 
                  tickLine={false} 
                  tickFormatter={(v) => `${v}`} 
                />
                <Tooltip
                  contentStyle={{ background: '#1B1D22', borderColor: '#2A2D35', borderRadius: '8px' }}
                  labelStyle={{ color: '#9CA3AF', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar 
                  yAxisId="left"
                  name="Monthly Revenue (INR)" 
                  dataKey="revenue" 
                  fill="#C6FF00" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                />
                <Bar 
                  yAxisId="right"
                  name="Active Members Count" 
                  dataKey="members" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
    </DashboardLayout>
  );
}
