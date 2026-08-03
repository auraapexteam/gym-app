import { Search, Plus, Menu, Bell } from 'lucide-react';
import { useUIStore } from '@/store';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface TopbarProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function Topbar({ title, breadcrumbs }: TopbarProps) {
  const { toggleMobileMenu, toggleNotificationDrawer } = useUIStore();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="min-h-20 bg-aura-bg/95 backdrop-blur-xl border-b border-aura-border flex items-center justify-between gap-4 px-6 sticky top-0 z-20">
      {/* Left: Hamburger menu + breadcrumbs / title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMobileMenu}
          className="h-10 w-10 rounded-md flex items-center justify-center text-aura-muted hover:text-aura-text bg-aura-card border border-aura-border transition-colors lg:hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

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

        {/* New Member Action */}
        <Link
          to="/members/add"
          className="h-10 w-10 sm:w-auto sm:px-4 rounded-md flex items-center justify-center gap-2 bg-aura-primary text-sm font-semibold text-aura-bg hover:bg-aura-primary/90 transition-colors"
          aria-label="New Member"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">New member</span>
        </Link>
      </div>
    </header>
  );
}
