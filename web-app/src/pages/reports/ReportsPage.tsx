import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { FileText, Download, Users, DollarSign, Activity, Wrench } from 'lucide-react';
import { toast } from 'sonner';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'members' | 'finance' | 'activity' | 'assets';
  icon: React.ElementType;
  iconColor: string;
  format: 'CSV' | 'PDF';
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  { id: 'rep-01', name: 'Member Attendance Report', description: 'Monthly summary of check-ins, peak attendance, and active hours.', category: 'activity', icon: Activity, iconColor: 'text-aura-primary', format: 'CSV' },
  { id: 'rep-02', name: 'Financial Revenue Summary', description: 'Audit of membership purchases, nutrition orders, and payments.', category: 'finance', icon: DollarSign, iconColor: 'text-aura-success', format: 'PDF' },
  { id: 'rep-03', name: 'Active Membership Directory', description: 'Database of all members, contact details, plans, and renewal dates.', category: 'members', icon: Users, iconColor: 'text-blue-400', format: 'CSV' },
  { id: 'rep-04', name: 'Equipment Service & Maintenance Logs', description: 'Log of machinery status, next service due, and historical costs.', category: 'assets', icon: Wrench, iconColor: 'text-orange-400', format: 'PDF' },
];

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = (report: ReportTemplate) => {
    setDownloading(report.id);
    toast.success(`Preparing ${report.name} for download...`);
    setTimeout(() => {
      setDownloading(null);
      toast.success(`${report.name} has been downloaded successfully!`);
    }, 2000);
  };

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reports' }]}
    >
      <div className="mb-6">
        <h1 className="text-xl font-bold text-aura-text">Reports & Analytics Export</h1>
        <p className="text-sm text-aura-muted mt-0.5">Export historical gym logs and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_TEMPLATES.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:border-aura-primary/30 transition-colors">
              <CardHeader className="flex-row items-start justify-between gap-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${report.iconColor}`} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">{report.name}</CardTitle>
                    <span className="inline-block bg-white/5 text-aura-muted font-mono text-[10px] px-2 py-0.5 rounded border border-white/5 mt-1 uppercase">
                      {report.format} · {report.category}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-aura-muted leading-relaxed mb-4">
                  {report.description}
                </p>
                <button
                  onClick={() => handleDownload(report)}
                  disabled={downloading !== null}
                  className="w-full flex items-center justify-center gap-2 bg-aura-bg hover:bg-white/5 text-aura-text border border-aura-border hover:border-aura-primary/50 text-xs font-semibold py-2.5 rounded-md transition-colors disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloading === report.id ? 'Generating...' : 'Export Report'}
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
