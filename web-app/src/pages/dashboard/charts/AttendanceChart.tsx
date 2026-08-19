import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { useAttendanceChart } from '@/hooks/useDashboard';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-aura-card border border-aura-border rounded-md p-3 shadow-aura-lg text-xs">
      <p className="text-aura-muted mb-1 font-medium">{label}</p>
      <p className="text-aura-primary font-semibold">{payload[0].value} check-ins</p>
    </div>
  );
};

export function AttendanceChart() {
  const { data, isLoading } = useAttendanceChart();

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <CardTitle>Weekly Attendance</CardTitle>
        <p className="text-xs text-aura-muted mt-0.5">Daily check-ins this week</p>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
              <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="checkins" fill="#C6FF00" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
