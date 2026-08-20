import { Search, Plus, Menu, Bell, Building2 } from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SearchInput } from '@/components/ui';

import { useJoinRequestStatus, useGymDirectory } from '@/hooks/useGyms';
import { useMembers } from '@/hooks/useMembers';

interface TopbarProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function Topbar({ title, breadcrumbs }: TopbarProps) {
  const { toggleMobileMenu, toggleNotificationDrawer } = useUIStore();
  const { user } = useAuthStore();
  const { data: joinStatus } = useJoinRequestStatus();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: membersRes } = useMembers({ limit: 100 });
  const members = membersRes?.data || [];
  const { data: gyms } = useGymDirectory();

  const isSuperAdmin = user?.role === 'super_admin';
  const isCustomer = user?.role === 'customer';

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    if (isSuperAdmin || isCustomer) {
      return (gyms || [])
        .filter((g: any) => g.name?.toLowerCase().includes(query) || g.ownerName?.toLowerCase().includes(query))
        .slice(0, 5)
        .map((g: any) => ({ id: g.id, title: g.name, subtitle: g.location || g.ownerName, type: 'Gym' }));
    } else {
      return (members || [])
        .filter((m: any) => m.name?.toLowerCase().includes(query) || m.email?.toLowerCase().includes(query) || m.memberId?.toLowerCase().includes(query))
        .slice(0, 5)
        .map((m: any) => ({ id: m.id, title: m.name, subtitle: m.memberId || m.email, type: 'Member' }));
    }
  }, [searchQuery, members, gyms, isSuperAdmin, isCustomer]);

  const renderSearchResults = () => {
    if (!searchQuery.trim()) return null;
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-aura-card border border-aura-border rounded-md shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
        {searchResults.length > 0 ? searchResults.map(res => (
          <Link 
            key={res.id} 
            to={res.type === 'Gym' ? `/super-admin/gyms/${res.id}` : `/members/${res.id}`} 
            className="block px-4 py-3 border-b border-aura-border/50 hover:bg-aura-bg transition-colors" 
            onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
          >
            <div className="flex justify-between items-center">
              <div className="min-w-0 pr-4">
                <p className="text-sm font-semibold text-aura-text truncate">{res.title}</p>
                <p className="text-xs text-aura-muted truncate">{res.subtitle}</p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-aura-primary/70 bg-aura-primary/10 px-2 py-0.5 rounded shrink-0">{res.type}</span>
            </div>
          </Link>
        )) : (
          <div className="p-4 text-center text-sm text-aura-muted">No results found for "{searchQuery}"</div>
        )}
      </div>
    );
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="min-h-16 sm:min-h-20 bg-aura-bg/95 backdrop-blur-xl border-b border-aura-border flex items-center justify-between gap-3 px-3 sm:px-6 sticky top-0 z-[9999]">
      {searchOpen ? (
        <div className="flex-1 flex items-center gap-3 w-full lg:hidden animate-in fade-in slide-in-from-top-2">
          <div className="flex-1 relative">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={isSuperAdmin ? 'Search gyms, owners...' : isCustomer ? 'Search gyms...' : 'Search members, plans...'}
            />
            {renderSearchResults()}
          </div>
          <button 
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery('');
            }}
            className="text-sm font-medium text-aura-muted hover:text-aura-text whitespace-nowrap px-2"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
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
        <div className="hidden lg:block w-72 relative">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={isSuperAdmin ? 'Search gyms, owners...' : isCustomer ? 'Search gyms...' : 'Search members, plans...'}
          />
          {renderSearchResults()}
        </div>

        {/* Search button on mobile */}
        <button
          onClick={() => setSearchOpen(true)}
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
        </>
      )}
    </header>
  );
}
