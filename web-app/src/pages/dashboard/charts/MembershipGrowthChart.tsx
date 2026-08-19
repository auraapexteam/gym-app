import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { useMembershipGrowth } from '@/hooks/useDashboard';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-aura-card border border-aura-border rounded-md p-3 shadow-aura-lg text-xs">
      <p className="text-aura-muted mb-2 font-medium">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="font-medium capitalize">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export function MembershipGrowthChart() {
  const { data, isLoading } = useMembershipGrowth();

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <CardTitle>Membership Growth</CardTitle>
        <p className="text-xs text-aura-muted mt-0.5">New members, churn and total count</p>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
              <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#9CA3AF', paddingTop: 12 }} />
              <Bar dataKey="new" name="New" fill="#C6FF00" radius={[3, 3, 0, 0]} maxBarSize={24} />
              <Bar dataKey="churned" name="Churned" fill="#EF4444" radius={[3, 3, 0, 0]} maxBarSize={24} />
              <Line type="monotone" dataKey="members" name="Total" stroke="#3B82F6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
