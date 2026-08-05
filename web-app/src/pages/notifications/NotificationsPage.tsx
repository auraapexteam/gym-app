import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Badge } from '@/components/ui';
import { Bell, CheckCheck, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { formatRelativeTime } from '@/utils';
import type { Notification } from '@/types';
import { useState } from 'react';

const typeConfig = {
  success: { icon: CheckCircle, color: 'text-aura-success', bg: 'bg-aura-success/10', badge: 'success' as const },
  warning: { icon: AlertTriangle, color: 'text-aura-warning', bg: 'bg-aura-warning/10', badge: 'warning' as const },
  error: { icon: XCircle, color: 'text-aura-danger', bg: 'bg-aura-danger/10', badge: 'danger' as const },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', badge: 'info' as const },
};

const FILTER_TABS = ['All', 'Unread', 'Success', 'Warning', 'Error'];

export default function NotificationsPage() {
  const [filter, setFilter] = useState('All');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'Unread') return !n.isRead;
    if (filter === 'All') return true;
    return n.type === filter.toLowerCase();
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifications' }]}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-aura-text">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-aura-primary text-aura-bg text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={markAllRead}
          className="flex items-center gap-2 text-sm text-aura-muted hover:text-aura-primary transition-colors"
        >
          <CheckCheck className="h-4 w-4" />
          Mark all as read
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-aura-card border border-aura-border rounded-md p-1 mb-4 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              filter === tab ? 'bg-aura-primary text-aura-bg' : 'text-aura-muted hover:text-aura-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="h-10 w-10 text-aura-muted/30 mx-auto mb-3" />
              <p className="text-aura-muted text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-aura-border">
              {filtered.map((notification) => {
                const config = typeConfig[notification.type];
                const IconComp = config.icon;
                return (
                  <div
                    key={notification.id}
                    onClick={() => setNotifications((prev) => prev.map((n) => n.id === notification.id ? { ...n, isRead: true } : n))}
                    className={`flex items-start gap-4 p-5 hover:bg-white/3 transition-colors cursor-pointer ${!notification.isRead ? 'bg-white/2' : ''}`}
                  >
                    <div className={`h-10 w-10 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                      <IconComp className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={`text-sm font-semibold ${!notification.isRead ? 'text-aura-text' : 'text-aura-muted'}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-aura-muted mt-0.5">{notification.message}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-aura-primary" />
                          )}
                          <Badge variant={config.badge}>{notification.type}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-aura-muted/60 mt-1.5">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
