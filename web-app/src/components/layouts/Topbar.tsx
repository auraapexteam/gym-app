import { Bell, Search, Settings, ChevronDown, LogOut, User, Plus } from 'lucide-react';
import { useAuthStore, useUIStore } from '@/store';
import { Avatar } from '@/components/ui';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface TopbarProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function Topbar({ title, breadcrumbs }: TopbarProps) {
  const { user, logout } = useAuthStore();
  const { toggleNotificationDrawer } = useUIStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="min-h-20 bg-aura-bg/95 backdrop-blur-xl border-b border-aura-border flex items-center justify-between gap-4 px-6 sticky top-0 z-20">
      {/* Left: breadcrumbs / title */}
      <div>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-aura-text">{breadcrumbs[breadcrumbs.length - 1].label}</h1>
              <span className="rounded-full border border-aura-primary/30 bg-aura-primary/10 px-2 py-0.5 text-xs font-medium text-aura-primary">
                Live
              </span>
            </div>
            <p className="mt-1 text-sm text-aura-muted">Tuesday, Jul 14 · Aura Apex Downtown</p>
          </div>
        ) : (
          <h1 className="text-base font-semibold text-aura-text">{title}</h1>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <div className="hidden lg:flex h-10 w-72 items-center gap-2 rounded-md border border-aura-border bg-aura-card px-3 text-aura-muted">
          <Search className="h-4 w-4" />
          <span className="text-sm">Search members, plans...</span>
        </div>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="h-10 w-10 rounded-md flex items-center justify-center text-aura-muted hover:text-aura-text bg-aura-card border border-aura-border transition-colors lg:hidden"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <button
          onClick={toggleNotificationDrawer}
          className="h-10 w-10 rounded-md flex items-center justify-center text-aura-muted hover:text-aura-text bg-aura-card border border-aura-border transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-aura-primary" />
        </button>

        {/* Settings */}
        <Link
          to="/settings"
          className="h-10 w-10 rounded-md flex items-center justify-center text-aura-muted hover:text-aura-text bg-aura-card border border-aura-border transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>

        <Link
          to="/members"
          className="hidden sm:flex h-10 items-center gap-2 rounded-md bg-aura-primary px-4 text-sm font-semibold text-aura-bg hover:bg-aura-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New member
        </Link>

        {/* Profile Menu */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-white/5 transition-colors"
          >
            <Avatar name={user?.name} src={user?.avatar} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-aura-text leading-none mb-0.5">{user?.name}</p>
              <p className="text-xs text-aura-muted capitalize leading-none">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
            <ChevronDown className="h-3 w-3 text-aura-muted" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 bg-aura-card border border-aura-border rounded-lg shadow-aura-lg overflow-hidden z-50"
              >
                <div className="p-3 border-b border-aura-border">
                  <p className="text-sm font-medium text-aura-text">{user?.name}</p>
                  <p className="text-xs text-aura-muted">{user?.email}</p>
                </div>
                <div className="p-1">
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-aura-muted hover:text-aura-text hover:bg-white/5 rounded-md transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-aura-muted hover:text-aura-text hover:bg-white/5 rounded-md transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-aura-danger hover:bg-aura-danger/10 rounded-md transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
