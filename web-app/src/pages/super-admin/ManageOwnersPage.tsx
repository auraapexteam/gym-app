import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { useAdminOwners, useAdminGyms, useOnboardGym, AdminOwner } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, Modal, Badge, Avatar } from '@/components/ui';
import { Crown, Plus, Search, Mail, Phone, Calendar, UserCheck, ShieldAlert, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ManageOwnersPage() {
  const { data: owners = [], isLoading: isLoadingOwners } = useAdminOwners();
  const { data: gyms = [] } = useAdminGyms();
  const onboardGymMutation = useOnboardGym();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<AdminOwner | null>(null);

  // Form states
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newOwnerStatus, setNewOwnerStatus] = useState<'active' | 'suspended'>('active');

  const handleAddOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwnerName || !newOwnerEmail || !newOwnerPhone) {
      toast.error('Please fill in all required fields.');
      return;
    }

    // Check if email already exists
    if (owners.some((o) => o.email.toLowerCase() === newOwnerEmail.toLowerCase())) {
      toast.error('An owner with this email already exists.');
      return;
    }

    onboardGymMutation.mutate({
      name: `${newOwnerName}'s Gym`,
      owner: {
        email: newOwnerEmail,
        fullName: newOwnerName,
      },
    });

    toast.success('Owner registered successfully!');
    setIsAddModalOpen(false);

    // Reset Form
    setNewOwnerName('');
    setNewOwnerEmail('');
    setNewOwnerPhone('');
    setNewOwnerStatus('active');
  };

  const handleToggleStatus = (owner: AdminOwner) => {
    toast.info(`Owner status updated.`);
  };

  // Filter owners
  const filteredOwners = owners.filter((owner) => {
    const matchesSearch = owner.name.toLowerCase().includes(search.toLowerCase()) ||
                          owner.email.toLowerCase().includes(search.toLowerCase()) ||
                          owner.phone.includes(search);
    const matchesStatus = statusFilter === 'all' || owner.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOwnersCount = owners.length;
  const activeOwnersCount = owners.filter(o => o.status === 'active').length;
  const suspendedOwnersCount = owners.filter(o => o.status === 'suspended').length;
  const totalGymsCount = gyms.length;
  const avgGymsPerOwner = totalOwnersCount ? (totalGymsCount / totalOwnersCount).toFixed(1) : '0';

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Super Admin' }, { label: 'Manage Owners' }]}>
      
      {/* 1. Header and Add Controls */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-aura-text flex items-center gap-2">
            <Crown className="h-6 w-6 text-aura-primary" /> Gym Owners Directory
          </h1>
          <p className="text-aura-muted text-sm mt-1">
            Manage platform gym owners, credential statuses, and branch mappings
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsAddModalOpen(true)}
          className="gap-2 self-start md:self-auto"
        >
          <Plus className="h-4 w-4" /> Add Gym Owner
        </Button>
      </div>

      {/* 2. Statistical Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-aura-card border-aura-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 bg-aura-primary/10 rounded-lg flex items-center justify-center text-aura-primary">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-aura-muted font-medium uppercase tracking-wider block">Total Owners</span>
              <span className="text-2xl font-bold text-aura-text">{totalOwnersCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-aura-card border-aura-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 bg-aura-success/10 rounded-lg flex items-center justify-center text-aura-success">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-aura-muted font-medium uppercase tracking-wider block">Active Accounts</span>
              <span className="text-2xl font-bold text-aura-text">{activeOwnersCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-aura-card border-aura-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 bg-aura-danger/10 rounded-lg flex items-center justify-center text-aura-danger">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-aura-muted font-medium uppercase tracking-wider block">Suspended Accounts</span>
              <span className="text-2xl font-bold text-aura-text">{suspendedOwnersCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-aura-card border-aura-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 bg-aura-info/10 rounded-lg flex items-center justify-center text-aura-info">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-aura-muted font-medium uppercase tracking-wider block">Avg Gyms / Owner</span>
              <span className="text-2xl font-bold text-aura-text">{avgGymsPerOwner}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Filters and Search */}
      <Card className="bg-aura-card border-aura-border mb-6">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-aura-muted" />
            <input
              type="text"
              placeholder="Search owners by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-aura-bg border border-aura-border rounded-md pl-10 pr-4 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full sm:w-40 text-xs bg-aura-bg"
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active Only' },
                { value: 'suspended', label: 'Suspended Only' }
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Owners Directory Table */}
      <Card className="bg-aura-card border-aura-border overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-aura-border bg-white/5">
                <th className="px-6 py-4 text-xs font-semibold text-aura-muted uppercase tracking-wider">Owner Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-aura-muted uppercase tracking-wider">Managed Branches</th>
                <th className="px-6 py-4 text-xs font-semibold text-aura-muted uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-aura-muted uppercase tracking-wider">Registration Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-aura-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-aura-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-border/40">
              {filteredOwners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-aura-muted text-sm">
                    No owners found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredOwners.map((owner) => {
                  const ownerGyms = gyms.filter((g) => owner.gyms.includes(g.id));
                  return (
                    <tr key={owner.id} className="hover:bg-white/5 transition-all">
                      
                      {/* Column 1: Profile and Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={owner.name} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-aura-text">{owner.name}</p>
                            <p className="text-xs text-aura-muted flex items-center gap-1.5 mt-0.5">
                              <Mail className="h-3 w-3" /> {owner.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Managed Branches */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                          {ownerGyms.length === 0 ? (
                            <span className="text-xs text-aura-muted italic">No registered branches</span>
                          ) : (
                            ownerGyms.map((g) => (
                              <Badge key={g.id} variant="info" className="text-[10px] bg-white/5 border-aura-border text-aura-text hover:border-aura-primary/30">
                                {g.name.replace('Aura Apex Fitness — ', '')}
                              </Badge>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Column 3: Contact */}
                      <td className="px-6 py-4">
                        <p className="text-xs text-aura-text font-medium flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-aura-muted" /> {owner.phone}
                        </p>
                      </td>

                      {/* Column 4: Registration Date */}
                      <td className="px-6 py-4 text-xs text-aura-muted whitespace-nowrap">
                        {owner.createdAt ? (
                          isNaN(Date.parse(owner.createdAt))
                            ? owner.createdAt
                            : new Date(owner.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Column 5: Status */}
                      <td className="px-6 py-4">
                        <Badge variant={owner.status === 'active' ? 'success' : 'danger'} className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5">
                          {owner.status}
                        </Badge>
                      </td>

                      {/* Column 6: Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(owner)}
                            className={`text-xs h-8 px-3 ${
                              owner.status === 'active' 
                                ? 'border-aura-danger/20 text-aura-danger hover:bg-aura-danger/10'
                                : 'border-aura-success/20 text-aura-success hover:bg-aura-success/10'
                            }`}
                          >
                            {owner.status === 'active' ? 'Suspend' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 5. Add Owner Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Gym Owner"
      >
        <form onSubmit={handleAddOwner} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Full Name *</label>
            <Input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={newOwnerName}
              onChange={(e) => setNewOwnerName(e.target.value)}
              className="text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Email Address *</label>
            <Input
              type="email"
              required
              placeholder="e.g. ramesh@gmail.com"
              value={newOwnerEmail}
              onChange={(e) => setNewOwnerEmail(e.target.value)}
              className="text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Phone Number *</label>
            <Input
              type="text"
              required
              placeholder="e.g. 9876543209"
              value={newOwnerPhone}
              onChange={(e) => setNewOwnerPhone(e.target.value)}
              className="text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Account Status *</label>
            <Select
              value={newOwnerStatus}
              onChange={(e) => setNewOwnerStatus(e.target.value as any)}
              className="text-xs bg-aura-bg"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' }
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-aura-border mt-6">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="text-xs">
              Register Owner
            </Button>
          </div>
        </form>
      </Modal>

    </DashboardLayout>
  );
}
