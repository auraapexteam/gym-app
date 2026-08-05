import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DashboardLayout } from '@/components/layouts';
import { useAdminGyms, useAdminOwners, useOnboardGym, useUpdateGymStatus, AdminGym } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, Modal, Badge } from '@/components/ui';
import { 
  Building2, Plus, Search, MapPin, Users, DollarSign, 
  AlertCircle, ZoomIn, ZoomOut, Maximize2, Sparkles, Trash2, Edit 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const chartData = [
  { month: 'Jan', active: 1, revenue: 580 },
  { month: 'Feb', active: 1, revenue: 820 },
  { month: 'Mar', active: 1, revenue: 1165 },
];

export default function ManageGymsPage() {
  const { data: gyms = [], isLoading: isLoadingGyms } = useAdminGyms();
  const { data: owners = [] } = useAdminOwners();
  const onboardGymMutation = useOnboardGym();
  const updateStatusMutation = useUpdateGymStatus();

  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'suspended' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [selectedGym, setSelectedGym] = useState<AdminGym | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Map refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Form states
  const [newGymName, setNewGymName] = useState('');
  const [newGymAddress, setNewGymAddress] = useState('');
  const [newGymPhone, setNewGymPhone] = useState('');
  const [newGymEmail, setNewGymEmail] = useState('');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('Password123!');
  const [newGymLat, setNewGymLat] = useState('12.9716');
  const [newGymLng, setNewGymLng] = useState('77.5946');
  const [newGymStatus, setNewGymStatus] = useState<AdminGym['status']>('active');

  // Initialize Map
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
      }).setView([12.95, 77.62], 11.5); // Centered on Bangalore central area

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(mapInstance.current);

      markersGroupRef.current = L.layerGroup().addTo(mapInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markersGroupRef.current = null;
      }
    };
  }, []);

  // Update Markers when gyms, filter, or search changes
  useEffect(() => {
    if (!mapInstance.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    const filtered = gyms.filter((gym) => {
      const matchesFilter = filter === 'all' || gym.status === filter;
      const matchesSearch = gym.name.toLowerCase().includes(search.toLowerCase()) ||
                            gym.address.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    filtered.forEach((gym) => {
      let color = '#22C55E'; // active
      if (gym.status === 'suspended') color = '#F97316'; // warning
      if (gym.status === 'expired') color = '#EF4444'; // danger
      if (gym.status === 'pending') color = '#3B82F6'; // info

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            position: relative; 
            width: 14px; 
            height: 14px; 
            background-color: ${color}; 
            border: 2px solid #FFFFFF; 
            border-radius: 50%;
            box-shadow: 0 0 12px ${color};
          " class="pulse-marker-wrapper">
            <div style="
              position: absolute;
              top: -6px;
              left: -6px;
              width: 22px;
              height: 22px;
              border-radius: 50%;
              border: 2px solid ${color};
              opacity: 0.8;
              animation: marker-pulse 1.8s ease-out infinite;
            "></div>
          </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([gym.lat, gym.lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedGym(gym);
        mapInstance.current?.setView([gym.lat, gym.lng], 13.5, { animate: true });
      });

      marker.addTo(markersGroupRef.current!);
    });
  }, [gyms, filter, search]);

  const handleZoomIn = () => {
    if (mapInstance.current) mapInstance.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstance.current) mapInstance.current.zoomOut();
  };

  const handleResetView = () => {
    if (mapInstance.current) mapInstance.current.setView([12.95, 77.62], 11.5);
  };

  const handleAddGym = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGymName || !newGymAddress || !ownerFullName || !ownerEmail) {
      toast.error('Please fill in Gym Name, Address, Owner Name, and Owner Email.');
      return;
    }

    onboardGymMutation.mutate({
      name: newGymName.trim(),
      address: newGymAddress.trim(),
      phone: newGymPhone.trim() || undefined,
      email: newGymEmail.trim() || undefined,
      owner: {
        fullName: ownerFullName.trim(),
        email: ownerEmail.trim(),
        password: ownerPassword || 'Password123!',
      },
    });

    setIsAddModalOpen(false);

    // Reset Form
    setNewGymName('');
    setNewGymAddress('');
    setNewGymPhone('');
    setNewGymEmail('');
    setOwnerFullName('');
    setOwnerEmail('');
    setOwnerPassword('Password123!');
    setNewGymLat('12.9716');
    setNewGymLng('77.5946');
    setNewGymStatus('active');
  };

  const totalRevenue = gyms.reduce((acc, curr) => acc + curr.monthlyRevenue, 0);
  const activeGymsCount = gyms.filter(g => g.status === 'active').length;
  const pendingGymsCount = gyms.filter(g => g.status === 'pending').length;
  const alertGymsCount = gyms.filter(g => g.status === 'suspended' || g.status === 'expired').length;

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Super Admin' }, { label: 'Manage Gyms' }]}>
      
      {/* 1. Horizontal Sliding Metrics Marquee */}
      <div className="w-full bg-[#131518] border border-aura-border rounded-lg overflow-hidden py-2 px-4 mb-6 flex items-center relative gap-4">
        <div className="flex items-center gap-2 border-r border-aura-border pr-4 shrink-0">
          <span className="h-2 w-2 rounded-full bg-aura-success animate-ping" />
          <span className="text-xs font-bold text-aura-success tracking-wider uppercase">LIVE STATUS</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="flex items-center gap-8 animate-[marquee_20s_linear_infinite] whitespace-nowrap hover:[animation-play-state:paused]">
            <span className="text-xs text-aura-muted flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-aura-primary" />
              Active Gyms: <strong className="text-aura-text font-bold">{activeGymsCount}</strong>
            </span>
            <span className="text-xs text-aura-muted flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-aura-info" />
              Total Members: <strong className="text-aura-text font-bold">{gyms.reduce((acc, g) => acc + g.totalMembers, 0)}</strong>
            </span>
            <span className="text-xs text-aura-muted flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-aura-success" />
              Platform MRR: <strong className="text-aura-text font-bold">₹{(totalRevenue / 100000).toFixed(2)}L</strong>
            </span>
            <span className="text-xs text-aura-muted flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-aura-warning" />
              Suspended/Expired Gyms: <strong className="text-aura-text font-bold">{alertGymsCount}</strong>
            </span>
            <span className="text-xs text-aura-muted flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5 text-aura-info" />
              Pending Integrations: <strong className="text-aura-text font-bold">{pendingGymsCount}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Left main: Map and Header */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-aura-card border border-aura-border p-4 rounded-xl">
            <div>
              <h2 className="text-lg font-bold text-aura-text">Subscribed Gyms Live Map</h2>
              <p className="text-xs text-aura-muted mt-0.5">Track branch locations, subscription status, and performance</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-aura-muted" />
                <input
                  type="text"
                  placeholder="Search branches..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-48 text-xs bg-aura-bg border border-aura-border rounded-md text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary"
                />
              </div>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="py-1.5 text-xs bg-aura-bg w-32"
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'suspended', label: 'Suspended' },
                  { value: 'pending', label: 'Pending' }
                ]}
              />
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="gap-1.5 text-xs shrink-0"
              >
                <Plus className="h-3.5 w-3.5" /> Add Gym
              </Button>
            </div>
          </div>

          {/* Leaflet Map container */}
          <div className="relative h-[480px] bg-aura-card border border-aura-border rounded-xl overflow-hidden shadow-aura-md">
            
            {/* Map Div */}
            <div ref={mapRef} className="w-full h-full z-10" />

            {/* Custom Map Floating Controls */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-[1000]">
              <button 
                onClick={handleZoomIn}
                className="h-8 w-8 bg-[#1B1D22]/90 border border-aura-border rounded-md flex items-center justify-center text-aura-text hover:text-aura-primary hover:bg-[#2A2D35] transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button 
                onClick={handleZoomOut}
                className="h-8 w-8 bg-[#1B1D22]/90 border border-aura-border rounded-md flex items-center justify-center text-aura-text hover:text-aura-primary hover:bg-[#2A2D35] transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button 
                onClick={handleResetView}
                className="h-8 w-8 bg-[#1B1D22]/90 border border-aura-border rounded-md flex items-center justify-center text-aura-text hover:text-aura-primary hover:bg-[#2A2D35] transition-colors"
                title="Fit Bounds"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-4 right-4 bg-[#1B1D22]/90 border border-aura-border px-3 py-2 rounded-lg z-[1000] flex gap-4 text-[10px] text-aura-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-aura-success" /> Active
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-aura-warning" /> Suspended
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-aura-danger" /> Expired
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-aura-info" /> Pending
              </span>
            </div>

            {/* Floating details overlay */}
            {selectedGym && (
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 bg-[#1B1D22]/95 backdrop-blur-xl border border-aura-border p-4 rounded-xl shadow-aura-lg z-[1000] animate-[fade-in_0.2s_ease-out]">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-sm text-aura-text">{selectedGym.name}</h3>
                    <p className="text-[10px] text-aura-muted mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-aura-primary shrink-0" />
                      {selectedGym.address.split(',')[0]}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedGym(null)}
                    className="text-aura-muted hover:text-aura-text text-sm p-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 mb-4 text-[11px] border-t border-b border-aura-border/40 py-2.5">
                  <div>
                    <span className="text-aura-muted block text-[9px] uppercase tracking-wider">Owner</span>
                    <span className="font-medium text-aura-text truncate block">{selectedGym.ownerName}</span>
                  </div>
                  <div>
                    <span className="text-aura-muted block text-[9px] uppercase tracking-wider">Status</span>
                    <Badge variant={
                      selectedGym.status === 'active' ? 'success' :
                      selectedGym.status === 'suspended' ? 'warning' :
                      selectedGym.status === 'expired' ? 'danger' :
                      'info'
                    } className="text-[9px] uppercase px-1.5 py-0">
                      {selectedGym.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-aura-muted block text-[9px] uppercase tracking-wider">Active Members</span>
                    <span className="font-medium text-aura-text">{selectedGym.activeMembers} / {selectedGym.totalMembers}</span>
                  </div>
                  <div>
                    <span className="text-aura-muted block text-[9px] uppercase tracking-wider">MRR</span>
                    <span className="font-bold text-aura-primary">₹{(selectedGym.monthlyRevenue / 1000).toFixed(1)}K</span>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  {selectedGym.status !== 'active' && (
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => {
                        updateStatusMutation.mutate({ id: selectedGym.id, status: 'active' });
                        setSelectedGym(prev => prev ? { ...prev, status: 'active' } : null);
                      }}
                      className="text-xs h-7 py-0 px-2.5"
                    >
                      Activate
                    </Button>
                  )}
                  {selectedGym.status === 'active' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        updateStatusMutation.mutate({ id: selectedGym.id, status: 'suspended' });
                        setSelectedGym(prev => prev ? { ...prev, status: 'suspended' } : null);
                      }}
                      className="text-xs h-7 py-0 px-2.5 border-aura-warning/30 text-aura-warning hover:bg-aura-warning/10"
                    >
                      Suspend
                    </Button>
                  )}
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => {
                      if (confirm(`Are you sure you want to suspend ${selectedGym.name}?`)) {
                        updateStatusMutation.mutate({ id: selectedGym.id, status: 'suspended' });
                        setSelectedGym(null);
                      }
                    }}
                    className="text-xs h-7 py-0 px-2.5"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar panels: Analytics Trend & Active List */}
        <div className="w-full xl:w-96 flex flex-col gap-6 shrink-0">
          
          {/* Card 1: GLOBAL SUBSCRIPTION INDEX */}
          <Card className="bg-aura-card border-aura-border shadow-aura-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-aura-muted uppercase tracking-wider">GLOBAL SUBSCRIPTION INDEX</CardTitle>
                <Badge variant="success" className="text-[10px] font-semibold text-aura-success bg-aura-success/10 border-aura-success/20">
                  +12.4%
                </Badge>
              </div>
              <div className="mt-1">
                <span className="text-2xl font-bold text-aura-text">₹{(totalRevenue / 100000).toFixed(2)}L</span>
                <span className="text-xs text-aura-muted ml-1">/ month</span>
              </div>
            </CardHeader>
            <CardContent>
              
              {/* Sparkline Area Chart */}
              <div className="h-28 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C6FF00" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#C6FF00" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" hide />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ background: '#1B1D22', borderColor: '#2A2D35', borderRadius: '8px' }}
                      labelStyle={{ color: '#9CA3AF', fontSize: '10px' }}
                      itemStyle={{ color: '#C6FF00', fontSize: '11px', fontWeight: 'bold' }}
                      formatter={(val) => [`₹${val}k`, 'Platform Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#C6FF00" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* AI Recommendation Panel */}
              <div className="mt-4 p-3 bg-white/5 border border-aura-border rounded-lg flex gap-2">
                <Sparkles className="h-5 w-5 text-aura-primary shrink-0 animate-pulse mt-0.5" />
                <div className="text-[11px] leading-relaxed text-aura-muted">
                  <span className="font-semibold text-aura-text block mb-0.5">AI Insights Engine</span>
                  AI suggests reaching out to owners of suspended accounts this week; offering a 10% reactivation rate discount can boost MRR by ₹45k.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: ACTIVE INTEGRATIONS LIST */}
          <Card className="bg-aura-card border-aura-border flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-aura-muted uppercase tracking-wider">ACTIVE INTEGRATIONS</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto px-4 divide-y divide-aura-border/40">
                {gyms.map((gym) => (
                  <div key={gym.id} className="py-3 flex items-center justify-between group">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-aura-text truncate group-hover:text-aura-primary transition-colors cursor-pointer" onClick={() => {
                        setSelectedGym(gym);
                        if (mapInstance.current) {
                          mapInstance.current.setView([gym.lat, gym.lng], 13.5, { animate: true });
                        }
                      }}>
                        {gym.name.replace('Aura Apex Fitness — ', '')}
                      </p>
                      <p className="text-[10px] text-aura-muted mt-0.5 truncate">{gym.ownerName} • {gym.activeMembers} active</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-aura-text block">₹{(gym.monthlyRevenue / 1000).toFixed(0)}K</span>
                      <Badge variant={
                        gym.status === 'active' ? 'success' :
                        gym.status === 'suspended' ? 'warning' :
                        gym.status === 'expired' ? 'danger' :
                        'info'
                      } className="text-[8px] uppercase tracking-wider font-extrabold px-1 py-0 mt-0.5">
                        {gym.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. Add Gym Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Gym"
      >
        <form onSubmit={handleAddGym} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Gym Name *</label>
            <Input
              type="text"
              required
              placeholder="e.g. Aura Apex Fitness — Malleshwaram"
              value={newGymName}
              onChange={(e) => setNewGymName(e.target.value)}
              className="text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Address *</label>
            <Input
              type="text"
              required
              placeholder="e.g. Margosa Rd, Malleshwaram, Bengaluru"
              value={newGymAddress}
              onChange={(e) => setNewGymAddress(e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-aura-text mb-1">Phone Number</label>
              <Input
                type="text"
                placeholder="e.g. 9876543210"
                value={newGymPhone}
                onChange={(e) => setNewGymPhone(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-aura-text mb-1">Email Address</label>
              <Input
                type="email"
                placeholder="e.g. mallesh@auraapex.com"
                value={newGymEmail}
                onChange={(e) => setNewGymEmail(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <div className="border-t border-aura-border pt-3 mt-3">
            <h4 className="text-xs font-semibold text-aura-primary mb-3">Owner Account Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-aura-text mb-1">Owner Full Name *</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Jack Miller"
                  value={ownerFullName}
                  onChange={(e) => setOwnerFullName(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-aura-text mb-1">Owner Email *</label>
                <Input
                  type="email"
                  required
                  placeholder="e.g. owner@ironparadise.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-aura-text mb-1">Owner Password *</label>
              <Input
                type="text"
                required
                placeholder="Password123!"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-aura-text mb-1">Latitude *</label>
              <Input
                type="text"
                required
                placeholder="e.g. 12.9716"
                value={newGymLat}
                onChange={(e) => setNewGymLat(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-aura-text mb-1">Longitude *</label>
              <Input
                type="text"
                required
                placeholder="e.g. 77.5946"
                value={newGymLng}
                onChange={(e) => setNewGymLng(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Subscription Status *</label>
            <Select
              value={newGymStatus}
              onChange={(e) => setNewGymStatus(e.target.value as any)}
              className="text-xs"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'pending', label: 'Pending Integration' },
                { value: 'suspended', label: 'Suspended' }
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register Gym
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ticker Animation CSS styling */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </DashboardLayout>
  );
}
