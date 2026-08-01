import { useUIStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCheck, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { formatRelativeTime } from '@/utils';
import type { Notification } from '@/types';

// Mock notifications for demo
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Membership Expiring',
    message: 'John Doe\'s membership expires in 3 days.',
    type: 'warning',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'Payment Received',
    message: 'Payment of ₹2,999 received from Sarah Smith.',
    type: 'success',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Equipment Alert',
    message: 'Treadmill #3 requires maintenance service.',
    type: 'error',
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'New Member Joined',
    message: 'Alex Johnson has registered as a new member.',
    type: 'info',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

const typeConfig = {
  success: { icon: CheckCircle, color: 'text-aura-success', bg: 'bg-aura-success/10' },
  warning: { icon: AlertTriangle, color: 'text-aura-warning', bg: 'bg-aura-warning/10' },
  error: { icon: XCircle, color: 'text-aura-danger', bg: 'bg-aura-danger/10' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
};

export function NotificationDrawer() {
  const { notificationDrawerOpen, setNotificationDrawerOpen } = useUIStore();
  const unreadCount = mockNotifications.filter((n) => !n.isRead).length;

  return (
    <AnimatePresence>
      {notificationDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setNotificationDrawerOpen(false)}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed right-0 top-0 h-screen w-full max-w-sm bg-aura-card border-l border-aura-border shadow-aura-lg z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-aura-border">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-aura-primary" />
                <h2 className="font-semibold text-aura-text">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-aura-primary text-aura-bg text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="text-xs text-aura-muted hover:text-aura-primary transition-colors flex items-center gap-1">
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
                <button
                  onClick={() => setNotificationDrawerOpen(false)}
                  className="text-aura-muted hover:text-aura-text transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="flex-1 overflow-y-auto divide-y divide-aura-border">
              {mockNotifications.map((notification) => {
                const config = typeConfig[notification.type];
                const IconComp = config.icon;
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-white/3 transition-colors cursor-pointer ${!notification.isRead ? 'bg-white/2' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`h-8 w-8 rounded-md ${config.bg} flex items-center justify-center shrink-0`}>
                        <IconComp className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notification.isRead ? 'text-aura-text' : 'text-aura-muted'}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-aura-primary mt-1.5 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-aura-muted mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-aura-muted/60 mt-1">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-aura-border">
              <button className="w-full text-sm text-aura-primary hover:text-aura-primary/80 transition-colors font-medium">
                View all notifications
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
