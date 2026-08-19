import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { usePeakHours } from '@/hooks/useDashboard';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-aura-card border border-aura-border rounded-md p-3 shadow-aura-lg text-xs">
      <p className="text-aura-muted mb-1 font-medium">{label}</p>
      <p className="text-aura-primary font-semibold">{payload[0].value} members</p>
    </div>
  );
};

export function PeakHoursChart() {
  const { data, isLoading } = usePeakHours();
  const max = data ? Math.max(...data.map((d) => d.count)) : 0;

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <CardTitle>Foot traffic today</CardTitle>
        <p className="text-xs text-aura-muted mt-0.5">Visits by hour</p>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        {isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 5, left: 10, bottom: 0 }}>
              <XAxis type="number" stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="hour" stroke="#9CA3AF" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={38} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={14}>
                {data?.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.count === max ? '#C6FF00' : '#C6FF0040'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
