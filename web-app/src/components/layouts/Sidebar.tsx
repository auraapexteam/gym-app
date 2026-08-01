import { cn } from '@/utils';
import { useUIStore, useAuthStore } from '@/store';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, UserCheck, Settings, ChevronRight,
  Dumbbell, Wrench, LogOut, Zap, DollarSign,
  ChevronLeft,
} from 'lucide-react';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  roles?: UserRole[];
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navConfig: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Check-ins', icon: UserCheck, href: '/checkins', roles: ['super_admin', 'gym_owner', 'staff', 'trainer'] },
    ],
  },
  {
    group: 'Operate',
    items: [
      { label: 'Members', icon: Users, href: '/members', roles: ['super_admin', 'gym_owner', 'staff'] },
      { label: 'Trainers', icon: Dumbbell, href: '/trainers', roles: ['super_admin', 'gym_owner', 'staff'] },
      { label: 'Equipment', icon: Wrench, href: '/equipment', roles: ['super_admin', 'gym_owner', 'staff'] },
    ],
  },
  {
    group: 'Business',
    items: [
      { label: 'Revenue', icon: DollarSign, href: '/payments', roles: ['super_admin', 'gym_owner', 'staff'] },
      { label: 'Settings', icon: Settings, href: '/settings' },
    ],
  },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const filteredNav = navConfig
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.roles || item.roles.includes(user?.role as UserRole),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 256 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-aura-card border-r border-aura-border flex flex-col z-30 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-aura-border h-16 shrink-0">
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <div className="h-8 w-8 rounded-md bg-aura-primary flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-aura-bg" />
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-aura-muted tracking-[0.18em]">AURA APEX</p>
                <p className="text-sm font-semibold text-aura-text">Owner Console</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {sidebarCollapsed && (
          <div className="mx-auto h-8 w-8 rounded-md bg-aura-primary flex items-center justify-center">
            <Zap className="h-4 w-4 text-aura-bg" />
          </div>
        )}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="text-aura-muted hover:text-aura-text transition-colors p-1 rounded-md hover:bg-white/5"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-6">
        {filteredNav.map((group) => (
          <div key={group.group}>
            {!sidebarCollapsed && (
              <p className="px-4 mb-1.5 text-xs font-semibold text-aura-muted uppercase tracking-wider">
                {group.group}
              </p>
            )}
            <ul className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href ||
                  (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <NavLink
                      to={item.href}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-aura-primary/10 text-aura-primary border border-aura-primary/20'
                          : 'text-aura-muted hover:text-aura-text hover:bg-white/5',
                        sidebarCollapsed && 'justify-center',
                      )}
                    >
                      <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-aura-primary')} />
                      {!sidebarCollapsed && (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}
                      {!sidebarCollapsed && item.badge && (
                        <span className="bg-aura-primary text-aura-bg text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                          {item.badge}
                        </span>
                      )}
                      {!sidebarCollapsed && isActive && (
                        <ChevronRight className="h-3 w-3 text-aura-primary/60" />
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle (when collapsed) */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mb-2 text-aura-muted hover:text-aura-text transition-colors p-2 rounded-md hover:bg-white/5"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* User Footer */}
      <div className="p-3 border-t border-aura-border shrink-0">
        {!sidebarCollapsed ? (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-aura-primary/10 border border-aura-primary/20 flex items-center justify-center text-xs font-bold text-aura-primary shrink-0">
              {user?.name
                ?.split(' ')
                .map((part) => part.charAt(0))
                .join('')
                .slice(0, 2)
                .toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-aura-text truncate">{user?.name}</p>
              <p className="text-xs text-aura-muted truncate">Owner · Aura Apex</p>
            </div>
            <button
              onClick={logout}
              className="text-aura-muted hover:text-aura-danger transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex justify-center text-aura-muted hover:text-aura-danger transition-colors p-1"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.aside>
  );
}
