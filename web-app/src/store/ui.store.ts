import { create } from 'zustand';

interface UIStore {
  sidebarCollapsed: boolean;
  notificationDrawerOpen: boolean;
  mobileMenuOpen: boolean;

  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleNotificationDrawer: () => void;
  setNotificationDrawerOpen: (v: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (v: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  notificationDrawerOpen: false,
  mobileMenuOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleNotificationDrawer: () =>
    set((s) => ({ notificationDrawerOpen: !s.notificationDrawerOpen })),
  setNotificationDrawerOpen: (v) => set({ notificationDrawerOpen: v }),
  toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
  setMobileMenuOpen: (v) => set({ mobileMenuOpen: v }),
}));
