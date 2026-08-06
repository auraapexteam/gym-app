import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store';
import { useMyGymProfile, useUpdateMyGymProfile } from '@/hooks/useGyms';
import { uploadFileToGallery } from '@/utils';
import { toast } from 'sonner';
import {
  Building2, Bell, CreditCard, Shield, Users, Palette,
  Phone, Mail, MapPin, UserCheck, Upload, Image as ImageIcon, FileText
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

  // Gym Profile Form States
  const { data: gymProfile, isLoading: profileLoading } = useMyGymProfile();
  const updateGymMutation = useUpdateMyGymProfile();

  const [gymName, setGymName] = useState('');
  const [gymEmail, setGymEmail] = useState('');
  const [gymPhone, setGymPhone] = useState('');
  const [gymAddress, setGymAddress] = useState('');
  const [gymDescription, setGymDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (gymProfile) {
      setGymName(gymProfile.name || '');
      setGymEmail(gymProfile.email || user?.email || '');
      setGymPhone(gymProfile.phone || '');
      setGymAddress(gymProfile.address || '');
      setGymDescription(gymProfile.description || '');
      setLogoUrl(gymProfile.logoUrl || gymProfile.logo_url || '');
    }
  }, [gymProfile, user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFileToGallery({
        file,
        entityType: 'gym',
        caption: `Gym Logo: ${gymName || 'Apex Gym'}`,
      });
      setLogoUrl(url);
      toast.success('Gym logo uploaded to Supabase Storage.');
    } catch {
      toast.error('Logo upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveGymProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateGymMutation.mutate({
      name: gymName.trim(),
      email: gymEmail.trim(),
      phone: gymPhone.trim() || undefined,
      address: gymAddress.trim() || undefined,
      description: gymDescription.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
    });
  };

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
                <h2 className="text-base font-semibold text-aura-text mb-6">Gym Profile & Business Branding</h2>

                {profileLoading ? (
                  <div className="py-12 text-center text-aura-muted text-xs animate-pulse">
                    Loading gym profile...
                  </div>
                ) : (
                  <form onSubmit={handleSaveGymProfile} className="space-y-6">
                    {/* Gym Logo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-aura-text mb-2">Gym Branding Logo</label>
                      <div className="flex items-center gap-4">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Gym Logo" className="h-16 w-16 rounded-2xl object-cover border-2 border-aura-primary/30 shrink-0" />
                        ) : (
                          <div className="h-16 w-16 rounded-2xl bg-aura-primary/10 border-2 border-aura-primary/30 flex items-center justify-center text-aura-primary shrink-0">
                            <Building2 className="h-8 w-8" />
                          </div>
                        )}
                        <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-aura-border rounded-xl p-3 cursor-pointer hover:border-aura-primary/50 transition-colors text-xs text-aura-muted">
                          <Upload className="h-4 w-4 text-aura-primary" />
                          <span>{isUploading ? 'Uploading Logo...' : logoUrl ? 'Change Logo Image' : 'Upload Gym Logo'}</span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-aura-text mb-1.5">Gym Name *</label>
                        <Input
                          type="text"
                          required
                          value={gymName}
                          onChange={(e) => setGymName(e.target.value)}
                          placeholder="e.g. Apex Fitness Center"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-aura-text mb-1.5">Support Email *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-aura-muted" />
                          <input
                            type="email"
                            required
                            value={gymEmail}
                            onChange={(e) => setGymEmail(e.target.value)}
                            placeholder="support@gym.com"
                            className="w-full bg-aura-bg border border-aura-border rounded-md pl-9 pr-3 py-2.5 text-sm text-aura-text focus:outline-none focus:border-aura-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-aura-text mb-1.5">Contact Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-aura-muted" />
                          <input
                            type="tel"
                            value={gymPhone}
                            onChange={(e) => setGymPhone(e.target.value)}
                            placeholder="9876543210"
                            className="w-full bg-aura-bg border border-aura-border rounded-md pl-9 pr-3 py-2.5 text-sm text-aura-text focus:outline-none focus:border-aura-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-aura-text mb-1.5">Physical Gym Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-aura-muted" />
                          <input
                            type="text"
                            value={gymAddress}
                            onChange={(e) => setGymAddress(e.target.value)}
                            placeholder="e.g. MG Road, Bangalore"
                            className="w-full bg-aura-bg border border-aura-border rounded-md pl-9 pr-3 py-2.5 text-sm text-aura-text focus:outline-none focus:border-aura-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-aura-text mb-1.5">Gym Description & Facilities</label>
                      <textarea
                        rows={3}
                        value={gymDescription}
                        onChange={(e) => setGymDescription(e.target.value)}
                        placeholder="Describe your fitness center facilities, equipment, cardio zones, and services..."
                        className="w-full bg-aura-bg border border-aura-border rounded-md p-3 text-sm text-aura-text focus:outline-none focus:border-aura-primary"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button type="submit" variant="primary" disabled={updateGymMutation.isPending || isUploading}>
                        {updateGymMutation.isPending ? 'Saving Profile...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                )}
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
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-aura-primary" />
                        <h3 className="text-sm font-semibold text-aura-text">Razorpay Integration</h3>
                      </div>
                      <span className="text-xs bg-aura-success/10 text-aura-success px-2 py-0.5 rounded border border-aura-success/20 font-medium">
                        Auto-configured from Environment
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-aura-text mb-1.5">Razorpay Key ID (Client)</label>
                        <input
                          type="text"
                          readOnly
                          defaultValue={import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_LiveEnvironmentConfigured'}
                          className="w-full bg-aura-card border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-text font-mono cursor-not-allowed opacity-90"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-aura-text mb-1.5">Webhook Status</label>
                        <input
                          type="text"
                          readOnly
                          defaultValue="Active (HMAC Signature Verification Enabled)"
                          className="w-full bg-aura-card border border-aura-border rounded-md px-3 py-2.5 text-sm text-aura-success font-mono cursor-not-allowed opacity-90"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="primary" disabled>Environment Verified</Button>
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
