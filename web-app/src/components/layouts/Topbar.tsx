import { Search, Plus, Menu, Bell, Building2 } from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useJoinRequestStatus } from '@/hooks/useGyms';

interface TopbarProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function Topbar({ title, breadcrumbs }: TopbarProps) {
  const { toggleMobileMenu, toggleNotificationDrawer } = useUIStore();
  const { user } = useAuthStore();
  const { data: joinStatus } = useJoinRequestStatus();
  const [searchOpen, setSearchOpen] = useState(false);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const isSuperAdmin = user?.role === 'super_admin';
  const isCustomer = user?.role === 'customer';

  return (
    <header className="min-h-16 sm:min-h-20 bg-aura-bg/95 backdrop-blur-xl border-b border-aura-border flex items-center justify-between gap-3 px-3 sm:px-6 sticky top-0 z-20">
      {/* Left: Hamburger menu + breadcrumbs / title */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        <button
          onClick={toggleMobileMenu}
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-md flex items-center justify-center text-aura-muted hover:text-aura-text bg-aura-card border border-aura-border transition-colors lg:hidden shrink-0"
          aria-label="Toggle Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {breadcrumbs && breadcrumbs.length > 0 ? (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-bold text-aura-text truncate">
                {breadcrumbs[breadcrumbs.length - 1].label}
              </h1>
              <span className="rounded-full border border-aura-primary/30 bg-aura-primary/10 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-aura-primary shrink-0">
                Live
              </span>
            </div>
            <p className="mt-0.5 text-xs sm:text-sm text-aura-muted truncate">
              {formattedDate} · {isSuperAdmin ? 'Aura Apex Platform' : isCustomer ? 'Customer Portal' : 'Apex Fitness Center'}
            </p>
          </div>
        ) : (
          <h1 className="text-base font-semibold text-aura-text truncate">{title}</h1>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <div className="hidden lg:flex h-10 w-72 items-center gap-2 rounded-md border border-aura-border bg-aura-card px-3 text-aura-muted">
          <Search className="h-4 w-4" />
          <span className="text-sm">
            {isSuperAdmin ? 'Search gyms, owners...' : isCustomer ? 'Search gyms...' : 'Search members, plans...'}
          </span>
        </div>

        {/* Search button on mobile */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="h-10 w-10 rounded-md flex items-center justify-center text-aura-muted hover:text-aura-text bg-aura-card border border-aura-border transition-colors lg:hidden"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Notification Bell */}
        <button
          onClick={toggleNotificationDrawer}
          className="h-10 w-10 rounded-md flex items-center justify-center text-aura-muted hover:text-aura-text bg-aura-card border border-aura-border transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Action Button */}
        {isSuperAdmin ? (
          <Link
            to="/super-admin/gyms"
            className="h-10 w-10 sm:w-auto sm:px-4 rounded-md flex items-center justify-center gap-2 bg-aura-primary text-sm font-semibold text-aura-bg hover:bg-aura-primary/90 transition-colors"
            aria-label="Onboard Gym"
          >
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Onboard Gym</span>
          </Link>
        ) : isCustomer ? (
          <Link
            to={joinStatus?.status === 'approved' ? "/customer/plans" : "/browse-gyms"}
            className="h-10 w-10 sm:w-auto sm:px-4 rounded-md flex items-center justify-center gap-2 bg-aura-primary text-sm font-semibold text-aura-bg hover:bg-aura-primary/90 transition-colors"
            aria-label={joinStatus?.status === 'approved' ? "Membership Plans" : "Explore Gyms"}
          >
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{joinStatus?.status === 'approved' ? "My Plans" : "Explore Gyms"}</span>
          </Link>
        ) : (
          <Link
            to="/members/add"
            className="h-10 w-10 sm:w-auto sm:px-4 rounded-md flex items-center justify-center gap-2 bg-aura-primary text-sm font-semibold text-aura-bg hover:bg-aura-primary/90 transition-colors"
            aria-label="New Member"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">New member</span>
          </Link>
        )}
      </div>
    </header>
  );
}
