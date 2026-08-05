import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Button } from '@/components/ui';
import { useAuthStore } from '@/store';
import {
  Building2, Bell, CreditCard, Shield, Users, Palette,
  Phone, Mail, Globe, UserCheck,
} from 'lucide-react';

const OWNER_SETTING_TABS = [
  { id: 'gym', label: 'Gym Profile', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'payment', label: 'Payment Gateway', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'roles', label: 'Roles & Permissions', icon: Users },
  { id: 'theme', label: 'Theme', icon: Palette },
];

const ADMIN_SETTING_TABS = [
  { id: 'platform', label: 'Platform Profile', icon: UserCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'theme', label: 'Theme', icon: Palette },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  const settingTabs = isSuperAdmin ? ADMIN_SETTING_TABS : OWNER_SETTING_TABS;
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'platform' : 'gym');

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: isSuperAdmin ? '/super-admin/gyms' : '/dashboard' }, { label: 'Settings' }]}
    >
      <div className="mb-6">
        <h1 className="text-xl font-bold text-aura-text">Settings</h1>
        <p className="text-sm text-aura-muted mt-0.5">
          {isSuperAdmin ? 'Manage platform configuration and account settings' : 'Manage your gym and business settings'}
        </p>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="lg:w-56 shrink-0">
          <Card>
            <CardContent className="p-2">
              <ul className="space-y-0.5">
                {settingTabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-aura-primary/10 text-aura-primary border border-aura-primary/20'
                          : 'text-aura-muted hover:text-aura-text hover:bg-white/5'
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'platform' && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-base font-semibold text-aura-text mb-6">Platform Super Admin Profile</h2>
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-aura-text mb-1.5">Admin Full Name</label>
                      <input
                        defaultValue={user?.name || 'Super Admin User'}
                        className="w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text focus:outline-none focus:border-aura-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-aura-text mb-1.5">Admin Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-aura-muted" />
                        <input
                          defaultValue={user?.email || 'admin@aura-apex.com'}
                          className="w-full bg-aura-bg border border-aura-border rounded-md pl-9 pr-3 py-2.5 text-sm text-aura-text focus:outline-none focus:border-aura-primary"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-aura-text mb-1.5">Role Scope</label>
                    <input
                      value="Global Platform Super Admin"
                      disabled
                      className="w-full bg-aura-card border border-aura-border text-aura-muted rounded-md px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button variant="primary">Save Changes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'gym' && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-base font-semibold text-aura-text mb-6">Gym Profile</h2>
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-aura-text mb-1.5">Gym Name</label>
                      <input
                        defaultValue="Apex Fitness Center"
                        className="w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text focus:outline-none focus:border-aura-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-aura-text mb-1.5">Owner Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-aura-muted" />
                        <input
                          defaultValue={user?.email || 'owner@aura-apex.com'}
                          className="w-full bg-aura-bg border border-aura-border rounded-md pl-9 pr-3 py-2.5 text-sm text-aura-text focus:outline-none focus:border-aura-primary"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button variant="primary">Save Changes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-base font-semibold text-aura-text mb-6">Notification Settings</h2>
                <div className="space-y-4">
                  {[
                    { label: 'System Alerts', desc: 'Notify on critical system notifications', checked: true },
                    { label: 'Platform Activity', desc: 'Alert on new gym onboardings', checked: true },
                    { label: 'Security Alerts', desc: 'Notify on suspicious auth attempts', checked: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-aura-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-aura-text">{item.label}</p>
                        <p className="text-xs text-aura-muted mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                        <div className="w-10 h-5 bg-aura-border rounded-full peer peer-checked:bg-aura-primary peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                      </label>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <Button variant="primary">Save Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'payment' && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-base font-semibold text-aura-text mb-6">Payment Gateway</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-aura-bg border border-aura-border rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="h-5 w-5 text-aura-primary" />
                      <h3 className="text-sm font-semibold text-aura-text">Razorpay Configuration</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-aura-text mb-1.5">API Key ID</label>
                        <input type="password" placeholder="rzp_live_••••••••••••••••" className="w-full bg-aura-card border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text focus:outline-none focus:border-aura-primary" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-aura-text mb-1.5">API Key Secret</label>
                        <input type="password" placeholder="••••••••••••••••••••••••" className="w-full bg-aura-card border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text focus:outline-none focus:border-aura-primary" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="primary">Save Configuration</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(activeTab === 'security' || activeTab === 'roles' || activeTab === 'theme') && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-aura-muted text-sm">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings configured for active environment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
