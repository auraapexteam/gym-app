import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { formatDate, isExpiringSoon } from '@/utils';
import { AlertTriangle, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const mockRenewals = [
  { member: 'Amit Kumar', date: new Date(Date.now() + 2 * 24 * 3600000).toISOString(), plan: 'Monthly' },
  { member: 'Deepika Nair', date: new Date(Date.now() + 4 * 24 * 3600000).toISOString(), plan: 'Premium' },
  { member: 'Rohan Joshi', date: new Date(Date.now() + 6 * 24 * 3600000).toISOString(), plan: 'Quarterly' },
  { member: 'Kavya Reddy', date: new Date(Date.now() + 10 * 24 * 3600000).toISOString(), plan: 'Monthly' },
  { member: 'Suresh Kumar', date: new Date(Date.now() + 14 * 24 * 3600000).toISOString(), plan: 'Yearly' },
];

export function UpcomingRenewals() {
  return (
    <Card className="h-full">
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Upcoming Renewals</CardTitle>
          <Link
            to="/members"
            className="text-xs text-aura-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-aura-border">
          {mockRenewals.map((renewal, i) => {
            const expiringSoon = isExpiringSoon(renewal.date, 7);
            return (
              <div key={i} className="flex items-center gap-3 px-6 py-3 hover:bg-white/3 transition-colors">
                <div className="h-8 w-8 rounded-full bg-aura-primary/10 flex items-center justify-center text-xs font-bold text-aura-primary shrink-0">
                  {renewal.member.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-aura-text truncate">{renewal.member}</p>
                  <p className="text-xs text-aura-muted">{renewal.plan}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-aura-text font-medium">{formatDate(renewal.date, 'MMM dd')}</p>
                  {expiringSoon && (
                    <div className="flex items-center gap-0.5 justify-end mt-0.5">
                      <AlertTriangle className="h-3 w-3 text-aura-warning" />
                      <span className="text-xs text-aura-warning">Soon</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
