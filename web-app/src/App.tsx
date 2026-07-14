import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Activity,
  Users,
  CreditCard,
  Calendar,
  Shield,
  QrCode,
  Settings,
  LogOut,
  Plus,
  Trash2,
  CheckCircle,
  TrendingUp,
  PlusCircle,
  UserCheck,
  Dumbbell,
  AlertCircle,
  RefreshCw,
  Image,
  X
} from "lucide-react";

// API Base configuration
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/v1";

// Axios Instance with authorization interceptor
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json"
  }
});

// Attach Authorization header automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// App Entry Point
export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("auth_token"));
  const [user, setUser] = useState<any>(null);
  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Authentication Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [regFullName, setRegFullName] = useState("");
  const [regPhone, setRegPhone] = useState("");

  // Global Toast Notification Helper
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch Current Profile & Gym Details on Mount/Login
  useEffect(() => {
    if (token) {
      localStorage.setItem("auth_token", token);
      fetchProfile();
    } else {
      localStorage.removeItem("auth_token");
      setUser(null);
      setGym(null);
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const profileRes = await api.get("/auth/me");
      const userProfile = profileRes.data.data;
      setUser(userProfile);

      // If user is Owner, Staff, or Trainer, load their gym profile details
      if (userProfile.gymId && userProfile.role !== "super_admin") {
        try {
          const gymRes = await api.get("/gyms/me");
          setGym(gymRes.data.data);
        } catch (err) {
          console.error("Failed to load gym info", err);
        }
      }
    } catch (err: any) {
      console.error("Auth verify error", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return showToast("Please fill in all fields", "error");

    setAuthLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { session, profile } = res.data.data;
      localStorage.setItem("auth_token", session.accessToken);
      setToken(session.accessToken);
      setUser(profile);
      showToast(`Welcome back, ${profile.fullName}!`, "success");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Invalid email or password";
      showToast(errorMsg, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !regFullName) {
      return showToast("Please fill in all required fields", "error");
    }

    setAuthLoading(true);
    try {
      const res = await api.post("/auth/register", {
        email,
        password,
        fullName: regFullName,
        phone: regPhone || undefined
      });
      const { session, profile } = res.data.data;
      localStorage.setItem("auth_token", session.accessToken);
      setToken(session.accessToken);
      setUser(profile);
      showToast("Account created successfully!", "success");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Registration failed. Try again.";
      showToast(errorMsg, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) await api.post("/auth/logout");
    } catch (e) {
      console.warn("Logout endpoint error", e);
    }
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
    setGym(null);
    setActiveTab("dashboard");
    showToast("Logged out successfully", "info");
  };

  // If initial auth check loading
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-dim text-on-surface">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 animate-spin text-primary" />
          <span className="font-headline text-lg font-medium tracking-wide">Loading Aura Apex Portal...</span>
        </div>
      </div>
    );
  }

  // --- 1. Login View ---
  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-surface p-4 overflow-hidden">
        {/* Background Decorative Ambient Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-secondary/8 to-transparent blur-[120px] pointer-events-none -z-10" />

        <div className="w-full max-w-[450px] glass-card rounded-lg p-8 shadow-2xl relative">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-tertiary flex items-center justify-center shadow-primary mb-4">
              <Dumbbell className="h-7 w-7 text-on-primary" />
            </div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">AURA APEX</h1>
            <p className="font-body text-sm text-on-surface-variant mt-1">
              {isSignUp ? "Create a New Account" : "Multi-Tenant Gym Portal"}
            </p>
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Full Name</label>
                  <div className="relative glass-card rounded-lg border border-outline-variant/30 focus-within:ring-2 focus-within:ring-secondary/40 focus-within:border-secondary/60 transition-all duration-200">
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full h-12 px-4 bg-transparent border-none font-body text-base text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
                      placeholder="Jack Carter"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Phone Number (Optional)</label>
                  <div className="relative glass-card rounded-lg border border-outline-variant/30 focus-within:ring-2 focus-within:ring-secondary/40 focus-within:border-secondary/60 transition-all duration-200">
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full h-12 px-4 bg-transparent border-none font-body text-base text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
                      placeholder="+919876543210"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Email Address</label>
              <div className="relative glass-card rounded-lg border border-outline-variant/30 focus-within:ring-2 focus-within:ring-secondary/40 focus-within:border-secondary/60 transition-all duration-200">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 bg-transparent border-none font-body text-base text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
                  placeholder="name@gym.com"
                />
              </div>
            </div>

            <div>
              <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Password</label>
              <div className="relative glass-card rounded-lg border border-outline-variant/30 focus-within:ring-2 focus-within:ring-secondary/40 focus-within:border-secondary/60 transition-all duration-200">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 bg-transparent border-none font-body text-base text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-4 bg-gradient-to-br from-primary to-tertiary rounded-full font-headline font-bold text-base text-on-primary shadow-primary transition-transform duration-200 active:scale-98 hover:opacity-90 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {authLoading ? "Processing..." : isSignUp ? "Create Account & Sign In" : "Sign In to Portal"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-body text-sm font-semibold text-secondary hover:text-primary transition-colors duration-200 cursor-pointer"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>

          {/* Toast Notification inside Login Box */}
          {notification && (
            <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 border ${
              notification.type === "success" ? "bg-primary/10 border-primary/20 text-primary" : "bg-error/10 border-error/20 text-error"
            }`}>
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="font-body text-sm font-medium">{notification.message}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- 2. Main Portal Wrapper ---
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col md:flex-row relative">
      {/* Background Decorative Ambient Blobs */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-secondary/5 to-transparent blur-[150px] pointer-events-none -z-10" />

      {/* Global Toast Alert */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 p-4 glass-elevated rounded-lg shadow-2xl flex items-center gap-3 border animate-slide-in border-outline-variant/30">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            notification.type === "success" ? "bg-primary/20 text-primary" : "bg-error/20 text-error"
          }`}>
            {notification.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          </div>
          <div>
            <p className="font-headline text-sm font-semibold text-on-surface">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-surface-container-low border-b md:border-b-0 md:border-r border-outline-variant/20 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-outline-variant/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-tertiary flex items-center justify-center shadow-primary">
              <Dumbbell className="h-5 w-5 text-on-primary" />
            </div>
            <div>
              <h2 className="font-headline font-extrabold text-lg text-on-surface tracking-tight">AURA APEX</h2>
              <span className="font-label text-[9px] font-bold text-primary tracking-widest uppercase">
                {user.role.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Navigation Links based on Roles */}
          <nav className="p-4 space-y-1">
            {/* Super Admin Dashboard Sidebar */}
            {user.role === "super_admin" && (
              <>
                <SidebarLink tab="dashboard" activeTab={activeTab} setActiveTab={setActiveTab} label="Platform Overview" icon={<Activity />} />
                <SidebarLink tab="gyms" activeTab={activeTab} setActiveTab={setActiveTab} label="Onboard Gym" icon={<PlusCircle />} />
                <SidebarLink tab="logs" activeTab={activeTab} setActiveTab={setActiveTab} label="Audit Logs" icon={<Shield />} />
              </>
            )}

            {/* Owner Dashboard Sidebar */}
            {user.role === "owner" && (
              <>
                <SidebarLink tab="dashboard" activeTab={activeTab} setActiveTab={setActiveTab} label="Overview" icon={<Activity />} />
                <SidebarLink tab="staff" activeTab={activeTab} setActiveTab={setActiveTab} label="Manage Staff" icon={<Users />} />
                <SidebarLink tab="trainers" activeTab={activeTab} setActiveTab={setActiveTab} label="Manage Trainers" icon={<UserCheck />} />
                <SidebarLink tab="members" activeTab={activeTab} setActiveTab={setActiveTab} label="Members List" icon={<Users />} />
                <SidebarLink tab="plans" activeTab={activeTab} setActiveTab={setActiveTab} label="Membership Plans" icon={<CreditCard />} />
                <SidebarLink tab="subscriptions" activeTab={activeTab} setActiveTab={setActiveTab} label="Record Sale (Cash)" icon={<Plus />} />
                <SidebarLink tab="qr" activeTab={activeTab} setActiveTab={setActiveTab} label="Rotate Gym QR" icon={<QrCode />} />
                <SidebarLink tab="gallery" activeTab={activeTab} setActiveTab={setActiveTab} label="Gym Gallery" icon={<Image className="h-5 w-5" />} />
                <SidebarLink tab="join-requests" activeTab={activeTab} setActiveTab={setActiveTab} label="Join Requests" icon={<PlusCircle />} />
                <SidebarLink tab="settings" activeTab={activeTab} setActiveTab={setActiveTab} label="Gym Profile" icon={<Settings />} />
              </>
            )}

            {/* Staff Dashboard Sidebar */}
            {user.role === "staff" && (
              <>
                <SidebarLink tab="dashboard" activeTab={activeTab} setActiveTab={setActiveTab} label="Front Desk" icon={<Activity />} />
                <SidebarLink tab="members" activeTab={activeTab} setActiveTab={setActiveTab} label="Members Directory" icon={<Users />} />
                <SidebarLink tab="checkin" activeTab={activeTab} setActiveTab={setActiveTab} label="Manual Checkin" icon={<UserCheck />} />
                <SidebarLink tab="qr" activeTab={activeTab} setActiveTab={setActiveTab} label="View Gym QR" icon={<QrCode />} />
              </>
            )}

            {/* Trainer Dashboard Sidebar */}
            {user.role === "trainer" && (
              <>
                <SidebarLink tab="dashboard" activeTab={activeTab} setActiveTab={setActiveTab} label="Overview" icon={<Activity />} />
                <SidebarLink tab="attendance" activeTab={activeTab} setActiveTab={setActiveTab} label="Member Log" icon={<Calendar />} />
              </>
            )}

            {/* Customer Dashboard Sidebar */}
            {user.role === "customer" && (
              <>
                <SidebarLink tab="dashboard" activeTab={activeTab} setActiveTab={setActiveTab} label="Overview" icon={<Activity />} />
              </>
            )}
          </nav>
        </div>

        {/* User Footer with Logout */}
        <div className="p-4 border-t border-outline-variant/20 bg-surface-container/30 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="font-headline text-sm font-semibold text-on-surface truncate">{user.fullName || user.email}</p>
            <p className="font-body text-xs text-on-surface-variant truncate">{gym?.name || "Aura Apex Platform"}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-all duration-200 cursor-pointer"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-[1400px] mx-auto w-full">
        {/* Render View Components depending on User Role */}
        {user.role === "super_admin" && (
          <SuperAdminView
            activeTab={activeTab}
            showToast={showToast}
          />
        )}

        {user.role === "owner" && gym && (
          <OwnerView
            activeTab={activeTab}
            gym={gym}
            setGym={setGym}
            showToast={showToast}
          />
        )}

        {user.role === "staff" && gym && (
          <StaffView
            activeTab={activeTab}
            gym={gym}
            showToast={showToast}
          />
        )}

        {user.role === "trainer" && gym && (
          <TrainerView
            activeTab={activeTab}
            gym={gym}
            showToast={showToast}
          />
        )}

        {user.role === "customer" && (
          <CustomerView
            user={user}
            setUser={setUser}
            showToast={showToast}
          />
        )}
      </main>
    </div>
  );
}

// Custom Navigation Link Component
function SidebarLink({ tab, activeTab, setActiveTab, label, icon }: {
  tab: string;
  activeTab: string;
  setActiveTab: (val: string) => void;
  label: string;
  icon: React.ReactNode;
}) {
  const active = activeTab === tab;
  return (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-headline text-sm font-medium transition-all duration-200 cursor-pointer ${
        active
          ? "bg-gradient-to-br from-primary to-tertiary text-on-primary font-bold shadow-primary"
          : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
      }`}
    >
      <span className={`h-5 w-5 ${active ? "text-on-primary" : "text-on-surface-variant"}`}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ============================================================================
//  3. SUPER ADMIN DASHBOARD COMPONENT
// ============================================================================
function SuperAdminView({ activeTab, showToast }: { activeTab: string; showToast: any }) {
  const [stats, setStats] = useState<any>(null);
  const [gyms, setGyms] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields for onboarding Gym & Owner
  const [gymName, setGymName] = useState("");
  const [gymSlug, setGymSlug] = useState("");
  const [gymEmail, setGymEmail] = useState("");
  const [gymPhone, setGymPhone] = useState("");
  const [gymAddress, setGymAddress] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "dashboard") {
        const statsRes = await api.get("/admin/stats");
        setStats(statsRes.data.data);
      } else if (activeTab === "gyms") {
        const gymsRes = await api.get("/admin/gyms");
        setGyms(gymsRes.data.data || []);
      } else if (activeTab === "logs") {
        const logsRes = await api.get("/admin/audit-logs");
        setAuditLogs(logsRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load platform data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardGym = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/admin/gyms", {
        name: gymName,
        slug: gymSlug || undefined,
        email: gymEmail || undefined,
        phone: gymPhone || undefined,
        address: gymAddress || undefined,
        owner: {
          email: ownerEmail,
          password: ownerPassword,
          fullName: ownerName
        }
      });
      showToast("Gym and Owner onboarded successfully!", "success");
      // Reset Form
      setGymName("");
      setGymSlug("");
      setGymEmail("");
      setGymPhone("");
      setGymAddress("");
      setOwnerEmail("");
      setOwnerName("");
      setOwnerPassword("");
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to onboard gym", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleGymStatus = async (gymId: string, currentStatus: string) => {
    try {
      const action = currentStatus === "suspended" ? "approve" : "suspend";
      await api.post(`/admin/gyms/${gymId}/${action}`);
      showToast(`Gym status changed to ${currentStatus === "suspended" ? "active" : "suspended"}`, "success");
      loadData();
    } catch (err: any) {
      showToast("Failed to change gym status", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* 3.1 Platform Dashboard Summary */}
      {activeTab === "dashboard" && stats && (
        <div className="space-y-8">
          <div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight">Platform Overview</h1>
            <p className="font-body text-base text-on-surface-variant mt-1">Real-time statistics of Aura Apex SaaS</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Onboarded Gyms" value={stats.totalGyms || "0"} icon={<Activity />} trend="+12% this month" />
            <StatCard title="Active Subscriptions" value={stats.totalSubscriptions || "0"} icon={<Users />} trend="Stable" />
            <StatCard title="Platform Revenue" value={`₹${stats.totalRevenue || "0"}`} icon={<CreditCard />} trend="+18% growth" />
            <StatCard title="Registered Members" value={stats.totalMembers || "0"} icon={<UserCheck />} trend="+34% growth" />
          </div>

          {/* Quick Info Panel */}
          <div className="glass-card rounded-lg p-6 border border-outline-variant/20">
            <h3 className="font-headline text-lg font-bold mb-2">Platform System Status</h3>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">
              All platform services are operational. Connected database instance: **Supabase DB**. Razorpay checkout service integration mode: **Test mode**.
            </p>
          </div>
        </div>
      )}

      {/* 3.2 Gym Onboarding and Management */}
      {activeTab === "gyms" && (
        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Onboard Gym Form */}
            <div className="w-full lg:w-1/2 glass-card rounded-lg p-6 border border-outline-variant/20 h-fit">
              <h2 className="font-headline text-xl font-bold mb-6 font-headline">Onboard New Gym (Tenant)</h2>
              <form onSubmit={handleOnboardGym} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Gym Name</label>
                    <input
                      type="text"
                      required
                      value={gymName}
                      onChange={(e) => setGymName(e.target.value)}
                      className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                      placeholder="Gold's Gym"
                    />
                  </div>
                  <div>
                    <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Gym Slug (Unique)</label>
                    <input
                      type="text"
                      required
                      value={gymSlug}
                      onChange={(e) => setGymSlug(e.target.value)}
                      className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                      placeholder="golds-gym"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Gym Email</label>
                    <input
                      type="email"
                      value={gymEmail}
                      onChange={(e) => setGymEmail(e.target.value)}
                      className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                      placeholder="info@golds.com"
                    />
                  </div>
                  <div>
                    <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Gym Phone</label>
                    <input
                      type="text"
                      value={gymPhone}
                      onChange={(e) => setGymPhone(e.target.value)}
                      className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Address</label>
                  <input
                    type="text"
                    value={gymAddress}
                    onChange={(e) => setGymAddress(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                    placeholder="123 Workout Ave, Fitness City"
                  />
                </div>

                <div className="border-t border-outline-variant/20 pt-4">
                  <h3 className="font-headline text-base font-bold text-secondary mb-4">Provision Gym Owner Account</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label text-[9px] font-extrabold tracking-widest text-primary uppercase mb-2">Owner Full Name</label>
                      <input
                        type="text"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block font-label text-[9px] font-extrabold tracking-widest text-primary uppercase mb-2">Owner Email</label>
                      <input
                        type="email"
                        required
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                        placeholder="owner@golds.com"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block font-label text-[9px] font-extrabold tracking-widest text-primary uppercase mb-2">Owner Password</label>
                    <input
                      type="password"
                      required
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                      placeholder="•••••••• (Min 8 chars)"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-br from-primary to-tertiary rounded-full font-headline font-bold text-base text-on-primary shadow-primary transition-transform duration-200 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Provisioning Gym..." : "Create Gym & Owner"}
                </button>
              </form>
            </div>

            {/* Gyms List */}
            <div className="w-full lg:w-1/2 space-y-4">
              <h2 className="font-headline text-xl font-bold mb-4 font-headline">Onboarded Gyms Directory</h2>
              {gyms.length === 0 ? (
                <div className="glass-card rounded-lg p-6 text-center text-on-surface-variant font-body">No Gyms found. Onboard a gym first.</div>
              ) : (
                <div className="space-y-4">
                  {gyms.map((g) => (
                    <div key={g.id} className="glass-card rounded-lg p-6 border border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-headline text-lg font-bold text-on-surface">{g.name}</h3>
                        <p className="font-body text-sm text-on-surface-variant mt-1">Slug: {g.slug} | Phone: {g.phone || "N/A"}</p>
                        <span className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          g.status === "active" ? "bg-primary/10 text-primary border border-primary/20" : "bg-error/10 text-error border border-error/20"
                        }`}>
                          {g.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggleGymStatus(g.id, g.status)}
                        className={`px-4 py-2 rounded-full font-headline text-xs font-bold transition-all duration-200 cursor-pointer ${
                          g.status === "suspended" ? "bg-primary text-on-primary shadow-primary" : "bg-error/10 text-error hover:bg-error/20 border border-error/30"
                        }`}
                      >
                        {g.status === "suspended" ? "Activate Gym" : "Suspend Gym"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3.3 Platform Audit Logs */}
      {activeTab === "logs" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-headline text-2xl font-extrabold font-headline">Global System Audit Logs</h2>
            <p className="font-body text-sm text-on-surface-variant mt-1">Historical ledger of administrative actions</p>
          </div>

          {auditLogs.length === 0 ? (
            <div className="glass-card rounded-lg p-6 text-center text-on-surface-variant font-body">No audit logs found.</div>
          ) : (
            <div className="glass-card rounded-lg border border-outline-variant/20 overflow-hidden">
              <table className="w-full text-left font-body border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant text-xs font-bold uppercase tracking-widest">
                    <th className="p-4">Action</th>
                    <th className="p-4">Resource Type</th>
                    <th className="p-4">Actor ID</th>
                    <th className="p-4">IP Address</th>
                    <th className="p-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-sm">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-all">
                      <td className="p-4 font-headline font-semibold text-primary">{log.action}</td>
                      <td className="p-4">{log.resourceType}</td>
                      <td className="p-4 font-mono text-xs">{log.actorId || "System"}</td>
                      <td className="p-4 font-mono text-xs">{log.ipAddress || "N/A"}</td>
                      <td className="p-4 text-on-surface-variant text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
//  4. OWNER DASHBOARD VIEW COMPONENT
// ============================================================================
function OwnerView({ activeTab, gym, setGym, showToast }: { activeTab: string; gym: any; setGym: any; showToast: any }) {
  const [loading, setLoading] = useState(true);
  const [dataList, setDataList] = useState<any[]>([]);
  const [plansList, setPlansList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Logo & Gallery Upload States
  const [gymLogo, setGymLogo] = useState(gym.logoUrl || "");
  const [logoUploading, setLogoUploading] = useState(false);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);

  // Member Search and Profile Detail Modal States
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedMemberPayments, setSelectedMemberPayments] = useState<any[]>([]);
  const [loadingMemberDetails, setLoadingMemberDetails] = useState(false);

  // Forms
  const [submitting, setSubmitting] = useState(false);

  // Gym Profile Inputs
  const [gymName, setGymName] = useState(gym.name);
  const [gymEmail, setGymEmail] = useState(gym.email || "");
  const [gymPhone, setGymPhone] = useState(gym.phone || "");
  const [gymAddress, setGymAddress] = useState(gym.address || "");
  const [gymDesc, setGymDesc] = useState(gym.description || "");

  // Staff Form Inputs
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffName, setStaffName] = useState("");

  // Trainer Form Inputs
  const [trainerEmail, setTrainerEmail] = useState("");
  const [trainerPassword, setTrainerPassword] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [trainerSpec, setTrainerSpec] = useState("");
  const [trainerBio, setTrainerBio] = useState("");

  // Member Form Inputs
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("");

  // Plan Form Inputs
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planDuration, setPlanDuration] = useState("");

  // Subscription/Sale Inputs
  const [saleMemberId, setSaleMemberId] = useState("");
  const [salePlanId, setSalePlanId] = useState("");

  // QR Value
  const [activeQr, setActiveQr] = useState<any>(null);

  useEffect(() => {
    loadTabDetails();
  }, [activeTab]);

  const loadTabDetails = async () => {
    setLoading(true);
    try {
      if (activeTab === "dashboard") {
        const anaRes = await api.get("/analytics/dashboard");
        setAnalytics(anaRes.data.data);
      } else if (activeTab === "staff") {
        const staffRes = await api.get("/gyms/me/staff");
        setDataList(staffRes.data.data);
      } else if (activeTab === "trainers") {
        const trainersRes = await api.get("/trainers");
        setDataList(trainersRes.data.data || []);
      } else if (activeTab === "members") {
        const membersRes = await api.get("/members");
        setDataList(membersRes.data.data || []);
      } else if (activeTab === "plans") {
        const plansRes = await api.get(`/plans?gymId=${gym.id}`);
        setDataList(plansRes.data.data || []);
      } else if (activeTab === "subscriptions") {
        const membersRes = await api.get("/members");
        const plansRes = await api.get(`/plans?gymId=${gym.id}`);
        const payRes = await api.get("/payments");
        setPlansList(plansRes.data.data || []);
        setDataList(membersRes.data.data || []);
        setPaymentsList(payRes.data.data || []);
      } else if (activeTab === "qr") {
        try {
          const qrRes = await api.get("/qr/active");
          setActiveQr(qrRes.data.data);
        } catch (e) {
          setActiveQr(null);
        }
      } else if (activeTab === "gallery") {
        const galRes = await api.get(`/gallery?gymId=${gym.id}`);
        setDataList(galRes.data.data || []);
      } else if (activeTab === "join-requests") {
        const requestsRes = await api.get("/gyms/join-requests/pending");
        setJoinRequests(requestsRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch dashboard content", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Gym Settings Update ---
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    try {
      const res = await api.post("/gallery/upload-url", {
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        entityType: "gym"
      });
      const { uploadUrl, publicUrl } = res.data.data;

      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type }
      });

      setGymLogo(publicUrl);
      showToast("Logo uploaded successfully! Save profile to commit changes.", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Failed to upload logo", "error");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleUpdateGym = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.patch("/gyms/me", {
        name: gymName,
        email: gymEmail,
        phone: gymPhone,
        address: gymAddress,
        description: gymDesc,
        logoUrl: gymLogo
      });
      setGym(res.data.data);
      showToast("Gym Profile updated successfully!", "success");
    } catch (err: any) {
      showToast("Failed to update profile", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Gym Gallery Operations ---
  const handleGalleryUpload = async (e: React.FormEvent<HTMLFormElement> & { target: any }) => {
    e.preventDefault();
    const file = e.target.elements.galleryFile.files?.[0];
    if (!file) return showToast("Please select an image file", "error");

    setUploadingImage(true);
    try {
      const res = await api.post("/gallery/upload-url", {
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        entityType: "gym"
      });
      const { uploadUrl, path } = res.data.data;

      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type }
      });

      await api.post("/gallery", {
        path,
        mimeType: file.type,
        size: file.size,
        entityType: "gym",
        entityId: gym.id,
        caption: galleryCaption || undefined
      });

      showToast("Image added to gallery successfully!", "success");
      setGalleryCaption("");
      e.target.reset();
      loadTabDetails();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to upload image", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteGalleryImage = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    try {
      await api.delete(`/gallery/${id}`);
      showToast("Image deleted successfully!", "success");
      loadTabDetails();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete image", "error");
    }
  };

  // --- Gym Join Requests Operations ---
  const handleApproveRequest = async (requestId: string) => {
    try {
      await api.patch(`/gyms/join-requests/${requestId}/approve`);
      showToast("Customer request approved successfully!", "success");
      const requestsRes = await api.get("/gyms/join-requests/pending");
      setJoinRequests(requestsRes.data.data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to approve request", "error");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!window.confirm("Are you sure you want to decline this request?")) return;
    try {
      await api.patch(`/gyms/join-requests/${requestId}/reject`);
      showToast("Customer request declined successfully.", "success");
      const requestsRes = await api.get("/gyms/join-requests/pending");
      setJoinRequests(requestsRes.data.data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to decline request", "error");
    }
  };

  const handleViewMemberDetails = async (member: any) => {
    setSelectedMember(member);
    setLoadingMemberDetails(true);
    try {
      const payRes = await api.get("/payments");
      const allPayments = payRes.data.data || [];
      const memberPayments = allPayments.filter((p: any) => p.memberId === member.id);
      setSelectedMemberPayments(memberPayments);
    } catch (err) {
      console.error("Failed to load member payments history", err);
    } finally {
      setLoadingMemberDetails(false);
    }
  };

  // --- Staff Onboarding ---
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/gyms/me/staff", {
        email: staffEmail,
        password: staffPassword,
        fullName: staffName
      });
      showToast("Staff member onboarded successfully!", "success");
      setStaffEmail("");
      setStaffPassword("");
      setStaffName("");
      loadTabDetails();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to add staff", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm("Are you sure you want to delete this staff member? This deletes their user credentials!")) return;
    try {
      await api.delete(`/gyms/me/staff/${staffId}`);
      showToast("Staff member removed successfully", "success");
      loadTabDetails();
    } catch (err: any) {
      showToast("Failed to delete staff member", "error");
    }
  };

  // --- Trainer Onboarding ---
  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/trainers", {
        fullName: trainerName,
        email: trainerEmail,
        password: trainerPassword || undefined,
        specialization: trainerSpec,
        bio: trainerBio
      });
      showToast("Trainer onboarded successfully!", "success");
      setTrainerName("");
      setTrainerEmail("");
      setTrainerPassword("");
      setTrainerSpec("");
      setTrainerBio("");
      loadTabDetails();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to add trainer", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrainer = async (trainerId: string) => {
    if (!confirm("Are you sure you want to delete this trainer? This will also remove their user account!")) return;
    try {
      await api.delete(`/trainers/${trainerId}`);
      showToast("Trainer removed successfully", "success");
      loadTabDetails();
    } catch (err: any) {
      showToast("Failed to delete trainer", "error");
    }
  };

  // --- Member Creation ---
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/members", {
        fullName: memberName,
        email: memberEmail || undefined,
        phone: memberPhone || undefined
      });
      showToast("Member added successfully", "success");
      setMemberName("");
      setMemberEmail("");
      setMemberPhone("");
      loadTabDetails();
    } catch (err: any) {
      showToast("Failed to add member", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;
    try {
      await api.delete(`/members/${memberId}`);
      showToast("Member soft-deleted", "success");
      loadTabDetails();
    } catch (err: any) {
      showToast("Failed to delete member", "error");
    }
  };

  // --- Plan Management ---
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/plans", {
        name: planName,
        price: Number(planPrice),
        durationDays: Number(planDuration)
      });
      showToast("Plan created successfully!", "success");
      setPlanName("");
      setPlanPrice("");
      setPlanDuration("");
      loadTabDetails();
    } catch (err: any) {
      showToast("Failed to create plan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      await api.delete(`/plans/${planId}`);
      showToast("Plan deleted successfully", "success");
      loadTabDetails();
    } catch (err: any) {
      showToast("Failed to delete plan", "error");
    }
  };

  // --- Subscriptions Cash Checkout ---
  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleMemberId || !salePlanId) return showToast("Select Member and Plan", "error");
    setSubmitting(true);
    try {
      await api.post("/subscriptions/manual", {
        memberId: saleMemberId,
        planId: salePlanId,
        method: "cash"
      });
      showToast("Subscription purchase recorded successfully!", "success");
      setSaleMemberId("");
      setSalePlanId("");
      loadTabDetails();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to record sale", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Rotate Gym QR ---
  const handleRotateQr = async () => {
    setSubmitting(true);
    try {
      const res = await api.post("/qr/generate", { label: "Reception Main Desk" });
      setActiveQr(res.data.data);
      showToast("Gym check-in QR code rotated and activated!", "success");
    } catch (err: any) {
      showToast("Failed to generate QR", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* 4.1 Dashboard Analytics Overview */}
      {activeTab === "dashboard" && analytics && (
        <div className="space-y-8">
          <div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight">Welcome, Owner of {gym.name}!</h1>
            <p className="font-body text-base text-on-surface-variant mt-1">Gym analytics and live totals</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Active Gym Members" value={analytics.members?.active || "0"} icon={<Users />} trend="Live Members" />
            <StatCard title="Active Subscriptions" value={analytics.subscriptions?.active || "0"} icon={<CreditCard />} trend="Paid Plans" />
            <StatCard title="Recent Revenue" value={`₹${analytics.revenue?.total || "0"}`} icon={<TrendingUp />} trend="Total Sales" />
            <StatCard title="Attendance Today" value={analytics.attendance?.today || "0"} icon={<UserCheck />} trend="Member scans" />
          </div>

          {/* Business overview */}
          <div className="glass-card rounded-lg p-6 border border-outline-variant/20">
            <h3 className="font-headline text-lg font-bold mb-4 font-headline">Operations Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-body">
              <div className="space-y-2">
                <p><span className="text-on-surface-variant font-medium">Inactive Members:</span> {analytics.members?.inactive || 0}</p>
                <p><span className="text-on-surface-variant font-medium">Pending Subscriptions:</span> {analytics.subscriptions?.pending || 0}</p>
              </div>
              <div className="space-y-2">
                <p><span className="text-on-surface-variant font-medium">Recent 30 Days Checks:</span> {analytics.attendance?.last30Days || 0}</p>
                <p><span className="text-on-surface-variant font-medium">Gym Address:</span> {gym.address || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4.2 Staff Onboarding */}
      {activeTab === "staff" && (
        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/2 glass-card rounded-lg p-6 border border-outline-variant/20 h-fit">
              <h2 className="font-headline text-xl font-bold mb-6 font-headline">Onboard Staff Member</h2>
              <form onSubmit={handleCreateStaff} className="space-y-6">
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                    placeholder="Sarah Connor"
                  />
                </div>
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                    placeholder="sarah@gym.com"
                  />
                </div>
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Login Password</label>
                  <input
                    type="password"
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-br from-primary to-tertiary rounded-full font-headline font-bold text-base text-on-primary shadow-primary transition-transform duration-200 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Onboarding Staff..." : "Create Staff Credentials"}
                </button>
              </form>
            </div>

            <div className="w-full lg:w-1/2 space-y-4">
              <h2 className="font-headline text-xl font-bold mb-4 font-headline">Gym Staff Directory</h2>
              {dataList.length === 0 ? (
                <div className="glass-card rounded-lg p-6 text-center text-on-surface-variant font-body">No Staff onboarded yet.</div>
              ) : (
                <div className="space-y-4">
                  {dataList.map((s) => (
                    <div key={s.id} className="glass-card rounded-lg p-4 border border-outline-variant/20 flex justify-between items-center">
                      <div>
                        <h4 className="font-headline font-semibold text-on-surface">{s.profiles?.full_name || "Name N/A"}</h4>
                        <p className="font-body text-xs text-on-surface-variant mt-0.5">{s.profiles?.email}</p>
                        <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-secondary/15 text-secondary border border-secondary/25">
                          {s.role}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteStaff(s.id)}
                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error/15 rounded-full transition-all duration-200 cursor-pointer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4.3 Trainer Onboarding */}
      {activeTab === "trainers" && (
        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/2 glass-card rounded-lg p-6 border border-outline-variant/20 h-fit">
              <h2 className="font-headline text-xl font-bold mb-6 font-headline">Onboard Gym Trainer</h2>
              <form onSubmit={handleCreateTrainer} className="space-y-6">
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Trainer Full Name</label>
                  <input
                    type="text"
                    required
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                    placeholder="Marcus Aurelius"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      value={trainerEmail}
                      onChange={(e) => setTrainerEmail(e.target.value)}
                      className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                      placeholder="marcus@gym.com"
                    />
                  </div>
                  <div>
                    <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Login Password</label>
                    <input
                      type="password"
                      required
                      value={trainerPassword}
                      onChange={(e) => setTrainerPassword(e.target.value)}
                      className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Specialization</label>
                  <input
                    type="text"
                    value={trainerSpec}
                    onChange={(e) => setTrainerSpec(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                    placeholder="Bodybuilding, Cardio, HIIT"
                  />
                </div>
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Bio Description</label>
                  <textarea
                    value={trainerBio}
                    onChange={(e) => setTrainerBio(e.target.value)}
                    className="w-full min-h-[80px] p-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                    placeholder="Professional athletic coach with 8+ years..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-br from-primary to-tertiary rounded-full font-headline font-bold text-base text-on-primary shadow-primary transition-transform duration-200 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Adding Trainer..." : "Onboard Trainer & Login"}
                </button>
              </form>
            </div>

            <div className="w-full lg:w-1/2 space-y-4">
              <h2 className="font-headline text-xl font-bold mb-4 font-headline">Gym Trainers Directory</h2>
              {dataList.length === 0 ? (
                <div className="glass-card rounded-lg p-6 text-center text-on-surface-variant font-body">No Trainers onboarded yet.</div>
              ) : (
                <div className="space-y-4">
                  {dataList.map((t) => (
                    <div key={t.id} className="glass-card rounded-lg p-4 border border-outline-variant/20 flex justify-between items-center">
                      <div>
                        <h4 className="font-headline font-semibold text-on-surface">{t.fullName}</h4>
                        <p className="font-body text-xs text-on-surface-variant mt-0.5">{t.email || "No Email Provided"}</p>
                        <p className="font-body text-xs text-secondary mt-1 font-semibold">{t.specialization || "General Trainer"}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteTrainer(t.id)}
                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error/15 rounded-full transition-all duration-200 cursor-pointer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4.4 Members Management */}
      {activeTab === "members" && (
        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/3 glass-card rounded-lg p-6 border border-outline-variant/20 h-fit">
              <h2 className="font-headline text-xl font-bold mb-6">Register Gym Member</h2>
              <form onSubmit={handleCreateMember} className="space-y-6">
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Email</label>
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                    placeholder="jane@gmail.com"
                  />
                </div>
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Phone</label>
                  <input
                    type="text"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                    placeholder="+919876543210"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-br from-primary to-tertiary rounded-full font-headline font-bold text-base text-on-primary shadow-primary transition-transform duration-200 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Creating..." : "Add Member"}
                </button>
              </form>
            </div>

            <div className="w-full lg:w-2/3 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="font-headline text-xl font-bold font-headline">Members Directory</h2>
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Search members..."
                    className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-sm text-on-surface focus:outline-none"
                  />
                </div>
              </div>

              {dataList.length === 0 ? (
                <div className="glass-card rounded-lg p-6 text-center text-on-surface-variant font-body">No Members registered.</div>
              ) : (
                <div className="space-y-4">
                  {dataList
                    .filter((m) =>
                      m.fullName?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                      m.email?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                      m.phone?.toLowerCase().includes(memberSearchQuery.toLowerCase())
                    )
                    .map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleViewMemberDetails(m)}
                        className="glass-card rounded-lg p-4 border border-outline-variant/20 flex justify-between items-center cursor-pointer hover:bg-white/5 hover:border-primary/30 transition-all"
                      >
                        <div>
                          <h4 className="font-headline font-semibold text-on-surface">{m.fullName}</h4>
                          <p className="font-body text-xs text-on-surface-variant mt-0.5">Email: {m.email || "N/A"} | Phone: {m.phone || "N/A"}</p>
                          <span className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            m.status === "active" ? "bg-primary/10 text-primary border border-primary/20" : "bg-error/10 text-error border border-error/20"
                          }`}>
                            {m.status}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMember(m.id);
                          }}
                          className="p-2 text-on-surface-variant hover:text-error hover:bg-error/15 rounded-full transition-all duration-200 cursor-pointer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}

                  {dataList.filter((m) =>
                    m.fullName?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                    m.email?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                    m.phone?.toLowerCase().includes(memberSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="glass-card rounded-lg p-6 text-center text-on-surface-variant font-body">No matching members found.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Member Details Modal Popup */}
          {selectedMember && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="glass-card w-full max-w-lg rounded-xl border border-outline-variant/20 overflow-hidden flex flex-col max-h-[85vh]">
                {/* Modal Header */}
                <div className="p-6 border-b border-outline-variant/15 flex justify-between items-center bg-surface-container-low">
                  <h3 className="font-headline text-xl font-bold text-on-surface">Member Profile Profile</h3>
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 font-body text-sm">
                  {/* Basic Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 text-primary font-bold text-2xl flex items-center justify-center uppercase shrink-0">
                      {selectedMember.fullName?.charAt(0) || "M"}
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-lg text-on-surface">{selectedMember.fullName}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 ${
                        selectedMember.status === "active" ? "bg-primary/10 text-primary border border-primary/20" : "bg-error/10 text-error border border-error/20"
                      }`}>
                        {selectedMember.status}
                      </span>
                    </div>
                  </div>

                  <div className="divider border-b border-outline-variant/15" />

                  {/* Contact Details */}
                  <div className="space-y-3">
                    <h5 className="font-label text-[10px] font-extrabold tracking-widest text-primary uppercase">Contact Details</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-on-surface-variant text-xs font-semibold">Email</p>
                        <p className="text-on-surface mt-0.5 font-medium">{selectedMember.email || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-on-surface-variant text-xs font-semibold">Phone</p>
                        <p className="text-on-surface mt-0.5 font-medium">{selectedMember.phone || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="divider border-b border-outline-variant/15" />

                  {/* Subscription Details */}
                  <div className="space-y-4">
                    <h5 className="font-label text-[10px] font-extrabold tracking-widest text-primary uppercase">Payment & Subscription History</h5>
                    {loadingMemberDetails ? (
                      <div className="flex justify-center p-4">
                        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : selectedMemberPayments.length === 0 ? (
                      <p className="text-on-surface-variant text-xs">No recorded subscription or cash sales for this member.</p>
                    ) : (
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                        {selectedMemberPayments.map((pay: any) => (
                          <div key={pay.id} className="p-3 bg-surface-container rounded-lg border border-outline-variant/20 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-semibold text-on-surface">Cash Subscription</p>
                              <p className="text-[10px] text-on-surface-variant mt-0.5">{new Date(pay.created_at).toLocaleDateString()}</p>
                            </div>
                            <span className="font-bold text-primary">₹{pay.amount}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-surface-container-low border-t border-outline-variant/15 flex justify-end">
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="px-6 py-2.5 bg-surface-container hover:bg-outline-variant/20 rounded-full font-headline font-bold text-xs transition-all duration-200 cursor-pointer"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4.5 Plans Management */}
      {activeTab === "plans" && (
        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/3 glass-card rounded-lg p-6 border border-outline-variant/20 h-fit">
              <h2 className="font-headline text-xl font-bold mb-6">Create Subscription Plan</h2>
              <form onSubmit={handleCreatePlan} className="space-y-6">
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                    placeholder="Monthly VIP Pass"
                  />
                </div>
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Price (INR)</label>
                  <input
                    type="number"
                    required
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                    placeholder="1999"
                  />
                </div>
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    value={planDuration}
                    onChange={(e) => setPlanDuration(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                    placeholder="30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-br from-primary to-tertiary rounded-full font-headline font-bold text-base text-on-primary shadow-primary transition-transform duration-200 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Creating..." : "Save Plan"}
                </button>
              </form>
            </div>

            <div className="w-full lg:w-2/3 space-y-4">
              <h2 className="font-headline text-xl font-bold mb-4 font-headline">Available Membership Plans</h2>
              {dataList.length === 0 ? (
                <div className="glass-card rounded-lg p-6 text-center text-on-surface-variant font-body">No Plans found. Create one.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dataList.map((p) => (
                    <div key={p.id} className="glass-card rounded-lg p-6 border border-outline-variant/20 flex flex-col justify-between">
                      <div>
                        <h4 className="font-headline font-bold text-lg text-on-surface">{p.name}</h4>
                        <div className="font-headline text-2xl font-extrabold text-primary mt-2">₹{p.price}</div>
                        <p className="font-body text-xs text-on-surface-variant mt-1">Duration: {p.durationDays} Days</p>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => handleDeletePlan(p.id)}
                          className="p-2 text-on-surface-variant hover:text-error hover:bg-error/15 rounded-full transition-all duration-200 cursor-pointer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4.6 Record Sale & Subscriptions ledger */}
      {activeTab === "subscriptions" && (
        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/3 glass-card rounded-lg p-6 border border-outline-variant/20 h-fit">
              <h2 className="font-headline text-xl font-bold mb-6">Record Cash Sale / Checkout</h2>
              <form onSubmit={handleRecordSale} className="space-y-6">
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Select Member</label>
                  <select
                    value={saleMemberId}
                    onChange={(e) => setSaleMemberId(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                  >
                    <option value="">-- Choose Member --</option>
                    {dataList.map((m) => (
                      <option key={m.id} value={m.id}>{m.fullName} ({m.email || m.phone || "No contact"})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Select Plan</label>
                  <select
                    value={salePlanId}
                    onChange={(e) => setSalePlanId(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                  >
                    <option value="">-- Choose Plan --</option>
                    {plansList.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-br from-primary to-tertiary rounded-full font-headline font-bold text-base text-on-primary shadow-primary transition-transform duration-200 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Processing..." : "Complete Cash Checkout"}
                </button>
              </form>
            </div>

            <div className="w-full lg:w-2/3 space-y-4">
              <h2 className="font-headline text-xl font-bold mb-4 font-headline">Recent Cash Payments Ledger</h2>
              {paymentsList.length === 0 ? (
                <div className="glass-card rounded-lg p-6 text-center text-on-surface-variant font-body">No payment transactions found.</div>
              ) : (
                <div className="glass-card border border-outline-variant/20 rounded-lg overflow-hidden">
                  <table className="w-full text-left font-body border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant text-xs font-bold uppercase tracking-widest">
                        <th className="p-4">Transaction ID</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Method</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Paid At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15 text-sm">
                      {paymentsList.map((pay) => (
                        <tr key={pay.id} className="hover:bg-white/5 transition-all">
                          <td className="p-4 font-mono text-xs">{pay.id}</td>
                          <td className="p-4 font-headline font-bold text-primary">₹{pay.amount}</td>
                          <td className="p-4 uppercase text-xs">{pay.method}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 rounded-full uppercase">
                              {pay.status}
                            </span>
                          </td>
                          <td className="p-4 text-on-surface-variant text-xs">{new Date(pay.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4.7 Rotate QR Code */}
      {activeTab === "qr" && (
        <div className="space-y-8 flex flex-col items-center justify-center min-h-[350px] text-center max-w-[550px] mx-auto">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20">
            <QrCode className="h-8 w-8" />
          </div>
          <h2 className="font-headline text-2xl font-extrabold tracking-tight">Gym Check-in QR Rotation</h2>
          <p className="font-body text-base text-on-surface-variant mt-2">
            Rotate your check-in QR code. Members scan the generated token on their mobile apps to check-in server-side.
          </p>

          {activeQr ? (
            <div className="mt-8 p-8 glass-card border border-outline-variant/30 rounded-lg space-y-4">
              <div className="bg-white p-4 rounded-lg inline-block shadow-lg">
                <div className="w-40 h-40 bg-surface flex flex-col items-center justify-center border-4 border-[#0e0e13] rounded text-[#0e0e13]">
                  <QrCode className="h-16 w-16 text-primary" />
                  <span className="text-[10px] font-bold mt-2 font-mono uppercase truncate w-32 tracking-wider">AURA APEX</span>
                </div>
              </div>
              <p className="font-mono text-xs text-on-surface-variant">Active Token: <span className="text-secondary font-bold">{activeQr.token}</span></p>
            </div>
          ) : (
            <div className="mt-8 text-on-surface-variant font-body bg-white/5 border border-white/10 rounded-lg p-6">
              No active QR code generated for this gym. Click rotate below to generate one.
            </div>
          )}

          <button
            onClick={handleRotateQr}
            disabled={submitting}
            className="mt-6 px-8 py-4 bg-gradient-to-br from-primary to-tertiary rounded-full font-headline font-bold text-base text-on-primary shadow-primary transition-transform duration-200 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Rotating QR..." : "Generate/Rotate QR Code"}
          </button>
        </div>
      )}

      {/* 4.8 Gym Showcase Gallery */}
      {activeTab === "gallery" && (
        <div className="space-y-8">
          <div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight">Gym Showcase Gallery</h1>
            <p className="font-body text-base text-on-surface-variant mt-1">Upload and manage promotional photos for {gym.name}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload form */}
            <div className="lg:col-span-1 glass-card rounded-lg p-6 border border-outline-variant/20 h-fit space-y-6">
              <h3 className="font-headline text-lg font-bold text-on-surface">Add New Photo</h3>
              <form onSubmit={handleGalleryUpload} className="space-y-4">
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Select Image</label>
                  <input
                    type="file"
                    name="galleryFile"
                    required
                    accept="image/*"
                    className="block w-full text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 file:cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Caption</label>
                  <input
                    type="text"
                    value={galleryCaption}
                    onChange={(e) => setGalleryCaption(e.target.value)}
                    placeholder="E.g. Cardio Zone, Heavy Free Weights"
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="w-full py-3 bg-primary text-on-primary rounded-full font-headline font-bold text-sm shadow-primary transition-transform duration-200 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {uploadingImage ? "Uploading..." : "Upload to Gallery"}
                </button>
              </form>
            </div>

            {/* Gallery list */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-headline text-lg font-bold text-on-surface">Gallery Directory</h3>
              {dataList.length === 0 ? (
                <div className="glass-card rounded-lg p-8 text-center text-on-surface-variant font-body">No images uploaded yet. Upload your first photo!</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {dataList.map((img) => (
                    <div key={img.id} className="glass-card rounded-lg overflow-hidden border border-outline-variant/20 flex flex-col justify-between">
                      <div className="w-full h-48 bg-surface-container overflow-hidden">
                        <img src={img.url} alt={img.caption || "Gallery"} className="w-full h-full object-cover hover:scale-105 transition-all duration-300" />
                      </div>
                      <div className="p-4 flex justify-between items-center gap-4">
                        <p className="font-body text-sm text-on-surface truncate">{img.caption || "No caption"}</p>
                        <button
                          onClick={() => handleDeleteGalleryImage(img.id)}
                          className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-all duration-200 cursor-pointer"
                          title="Delete image"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4.9 Join Requests Tab */}
      {activeTab === "join-requests" && (
        <div className="space-y-8">
          <div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight">Pending Gym Join Requests</h1>
            <p className="font-body text-base text-on-surface-variant mt-1">Review and approve customers requesting to link to your gym</p>
          </div>

          <div className="glass-card border border-outline-variant/20 rounded-lg overflow-hidden">
            {joinRequests.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-body">No pending join requests at this time.</div>
            ) : (
              <table className="w-full text-left font-body border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant text-xs font-bold uppercase tracking-widest">
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Requested On</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-sm">
                  {joinRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/5 transition-all">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center uppercase">
                            {req.profiles?.fullName?.charAt(0) || "C"}
                          </div>
                          <div>
                            <p className="font-headline font-semibold text-on-surface">{req.profiles?.fullName || "New Member"}</p>
                            <p className="font-body text-xs text-on-surface-variant">{req.profiles?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-body text-on-surface-variant">{req.profiles?.phone || "N/A"}</td>
                      <td className="p-4 text-on-surface-variant text-xs">{new Date(req.created_at).toLocaleString()}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleApproveRequest(req.id)}
                          className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-dim rounded-full font-headline font-bold text-xs shadow-primary transition-all duration-200 cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="px-4 py-2 bg-error/10 text-error hover:bg-error/20 border border-error/30 rounded-full font-headline font-bold text-xs transition-all duration-200 cursor-pointer"
                        >
                          Decline
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 4.10 Gym Settings Profile */}
      {activeTab === "settings" && (
        <div className="space-y-8 max-w-[650px] mx-auto glass-card rounded-lg p-6 border border-outline-variant/20">
          <h2 className="font-headline text-xl font-bold mb-6">Edit Gym Profile Settings</h2>
          <form onSubmit={handleUpdateGym} className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-surface-container-low rounded-lg border border-outline-variant/20 mb-6">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-container flex items-center justify-center border border-outline-variant/30 shrink-0">
                {gymLogo ? (
                  <img src={gymLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Dumbbell className="w-8 h-8 text-on-surface-variant" />
                )}
              </div>
              <div className="space-y-2 flex-1">
                <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase">Gym Logo Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 file:cursor-pointer"
                />
                {logoUploading && <p className="text-xs text-secondary animate-pulse mt-1">Uploading logo to storage...</p>}
              </div>
            </div>
            <div>
              <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Gym Name</label>
              <input
                type="text"
                required
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Gym Email</label>
                <input
                  type="email"
                  value={gymEmail}
                  onChange={(e) => setGymEmail(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Gym Phone</label>
                <input
                  type="text"
                  value={gymPhone}
                  onChange={(e) => setGymPhone(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Physical Address</label>
              <input
                type="text"
                value={gymAddress}
                onChange={(e) => setGymAddress(e.target.value)}
                className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Description / Bio</label>
              <textarea
                value={gymDesc}
                onChange={(e) => setGymDesc(e.target.value)}
                className="w-full min-h-[100px] p-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-br from-primary to-tertiary rounded-full font-headline font-bold text-base text-on-primary shadow-primary transition-transform duration-200 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Saving..." : "Save Gym Profile"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ============================================================================
//  5. STAFF VIEW COMPONENT
// ============================================================================
function StaffView({ activeTab, gym, showToast }: { activeTab: string; gym: any; showToast: any }) {
  const [dataList, setDataList] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("");

  const [checkinMemberId, setCheckinMemberId] = useState("");
  const [activeQr, setActiveQr] = useState<any>(null);

  useEffect(() => {
    loadStaffDetails();
  }, [activeTab]);

  const loadStaffDetails = async () => {
    setLoading(true);
    try {
      if (activeTab === "dashboard") {
        const statsRes = await api.get("/attendance/stats");
        setDataList([]);
        setAttendanceList([statsRes.data.data]);
      } else if (activeTab === "members") {
        const membersRes = await api.get("/members");
        setDataList(membersRes.data.data || []);
      } else if (activeTab === "checkin") {
        const membersRes = await api.get("/members");
        const attRes = await api.get("/attendance");
        setDataList(membersRes.data.data || []);
        setAttendanceList(attRes.data.data || []);
      } else if (activeTab === "qr") {
        try {
          const qrRes = await api.get("/qr/active");
          setActiveQr(qrRes.data.data);
        } catch (e) {
          setActiveQr(null);
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/members", {
        fullName: memberName,
        email: memberEmail || undefined,
        phone: memberPhone || undefined
      });
      showToast("Member registered successfully", "success");
      setMemberName("");
      setMemberEmail("");
      setMemberPhone("");
      loadStaffDetails();
    } catch (err: any) {
      showToast("Failed to add member", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Manual checkin
  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinMemberId) return showToast("Select a member", "error");
    setSubmitting(true);
    try {
      await api.post("/attendance/manual", { memberId: checkinMemberId });
      showToast("Member checked in successfully!", "success");
      setCheckinMemberId("");
      loadStaffDetails();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Checkin failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* 5.1 Staff Dashboard Overview */}
      {activeTab === "dashboard" && attendanceList[0] && (
        <div className="space-y-8">
          <div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight">Front Desk Dashboard</h1>
            <p className="font-body text-base text-on-surface-variant mt-1">{gym.name} Operating Portal</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard title="Checked-in Today" value={attendanceList[0].today || "0"} icon={<UserCheck />} trend="Daily Scans" />
            <StatCard title="Last 7 Days Scans" value={attendanceList[0].last7Days || "0"} icon={<Calendar />} trend="Weekly checks" />
            <StatCard title="Last 30 Days Scans" value={attendanceList[0].last30Days || "0"} icon={<Activity />} trend="Monthly checks" />
          </div>
        </div>
      )}

      {/* 5.2 Member Directory & Quick Add */}
      {activeTab === "members" && (
        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/3 glass-card rounded-lg p-6 border border-outline-variant/20 h-fit">
              <h2 className="font-headline text-xl font-bold mb-6">Quick Register Member</h2>
              <form onSubmit={handleAddMember} className="space-y-6">
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Member Name</label>
                  <input
                    type="text"
                    required
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Email Address</label>
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                    placeholder="jane@gmail.com"
                  />
                </div>
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                    placeholder="+919876543210"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-br from-primary to-tertiary rounded-full font-headline font-bold text-base text-on-primary shadow-primary transition-transform duration-200 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Registering..." : "Add Member"}
                </button>
              </form>
            </div>

            <div className="w-full lg:w-2/3 space-y-4">
              <h2 className="font-headline text-xl font-bold mb-4">Gym Members List</h2>
              {dataList.length === 0 ? (
                <div className="glass-card rounded-lg p-6 text-center text-on-surface-variant font-body">No members found.</div>
              ) : (
                <div className="space-y-4">
                  {dataList.map((m) => (
                    <div key={m.id} className="glass-card rounded-lg p-4 border border-outline-variant/20">
                      <h4 className="font-headline font-semibold text-on-surface">{m.fullName}</h4>
                      <p className="font-body text-xs text-on-surface-variant mt-0.5">Email: {m.email || "N/A"} | Phone: {m.phone || "N/A"}</p>
                      <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        m.status === "active" ? "bg-primary/10 text-primary border border-primary/20" : "bg-error/10 text-error border border-error/20"
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5.3 Manual Front Desk Checkin */}
      {activeTab === "checkin" && (
        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/3 glass-card rounded-lg p-6 border border-outline-variant/20 h-fit">
              <h2 className="font-headline text-xl font-bold mb-6 font-headline">Reception Desk Check-in</h2>
              <form onSubmit={handleManualCheckIn} className="space-y-6">
                <div>
                  <label className="block font-label text-[10px] font-extrabold tracking-widest text-primary uppercase mb-2">Select Checked-in Member</label>
                  <select
                    value={checkinMemberId}
                    onChange={(e) => setCheckinMemberId(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-base text-on-surface focus:outline-none"
                  >
                    <option value="">-- Choose Member --</option>
                    {dataList.map((m) => (
                      <option key={m.id} value={m.id}>{m.fullName} ({m.email || m.phone || "No contact"})</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-br from-primary to-tertiary rounded-full font-headline font-bold text-base text-on-primary shadow-primary transition-transform duration-200 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Checking In..." : "Check In Member"}
                </button>
              </form>
            </div>

            <div className="w-full lg:w-2/3 space-y-4">
              <h2 className="font-headline text-xl font-bold mb-4 font-headline">Recent Checkin Logs</h2>
              {attendanceList.length === 0 ? (
                <div className="glass-card rounded-lg p-6 text-center text-on-surface-variant font-body">No attendance logged today.</div>
              ) : (
                <div className="glass-card border border-outline-variant/20 rounded-lg overflow-hidden">
                  <table className="w-full text-left font-body border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant text-xs font-bold uppercase tracking-widest">
                        <th className="p-4">Member Name</th>
                        <th className="p-4">Method</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15 text-sm">
                      {attendanceList.map((att) => (
                        <tr key={att.id} className="hover:bg-white/5 transition-all">
                          <td className="p-4 font-headline font-semibold text-on-surface">{att.members?.full_name || "Member Name"}</td>
                          <td className="p-4 uppercase text-xs font-semibold text-primary">{att.method}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 rounded-full uppercase">
                              {att.status}
                            </span>
                          </td>
                          <td className="p-4 text-on-surface-variant text-xs">{new Date(att.checkedInAt || att.checked_in_at).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5.4 View Active QR Code Token */}
      {activeTab === "qr" && (
        <div className="space-y-8 flex flex-col items-center justify-center min-h-[300px] text-center max-w-[550px] mx-auto">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20">
            <QrCode className="h-8 w-8" />
          </div>
          <h2 className="font-headline text-2xl font-extrabold tracking-tight">Active Check-in QR Token</h2>
          <p className="font-body text-base text-on-surface-variant mt-2">
            Display this QR code at the reception desk. Customers scan it with their mobile apps to verify and register attendance check-in.
          </p>

          {activeQr ? (
            <div className="mt-8 p-8 glass-card border border-outline-variant/30 rounded-lg space-y-4">
              <div className="bg-white p-4 rounded-lg inline-block shadow-lg">
                <div className="w-40 h-40 bg-surface flex flex-col items-center justify-center border-4 border-[#0e0e13] rounded text-[#0e0e13]">
                  <QrCode className="h-16 w-16 text-primary" />
                  <span className="text-[10px] font-bold mt-2 font-mono uppercase truncate w-32 tracking-wider">AURA APEX</span>
                </div>
              </div>
              <p className="font-mono text-xs text-on-surface-variant">Active Token Value: <span className="text-secondary font-bold">{activeQr.token}</span></p>
            </div>
          ) : (
            <div className="mt-8 text-on-surface-variant font-body bg-white/5 border border-white/10 rounded-lg p-6">
              No active QR code generated for this gym. Please request the Gym Owner to generate a new QR token.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
//  6. TRAINER PORTAL VIEW COMPONENT
// ============================================================================
function TrainerView({ activeTab, gym, showToast }: { activeTab: string; gym: any; showToast: any }) {
  const [trainersList, setTrainersList] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrainerDetails();
  }, [activeTab]);

  const loadTrainerDetails = async () => {
    setLoading(true);
    try {
      if (activeTab === "dashboard") {
        const trainersRes = await api.get("/trainers");
        setTrainersList(trainersRes.data.data || []);
      } else if (activeTab === "attendance") {
        const attRes = await api.get("/attendance");
        setAttendanceList(attRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch data", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* 6.1 Dashboard overview */}
      {activeTab === "dashboard" && (
        <div className="space-y-8">
          <div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight">Trainer Dashboard</h1>
            <p className="font-body text-base text-on-surface-variant mt-1">Specialized coaches of {gym.name}</p>
          </div>

          <h3 className="font-headline text-xl font-bold mb-4 font-headline">Gym Trainers Directory</h3>
          {trainersList.length === 0 ? (
            <div className="glass-card rounded-lg p-6 text-center text-on-surface-variant font-body">No Trainers found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {trainersList.map((t) => (
                <div key={t.id} className="glass-card rounded-lg p-6 border border-outline-variant/20">
                  <h4 className="font-headline font-bold text-lg text-on-surface">{t.fullName}</h4>
                  <p className="font-body text-xs text-on-surface-variant mt-1">{t.email || "No Email Address"}</p>
                  <p className="font-body text-xs text-secondary mt-2 font-semibold uppercase tracking-wider">{t.specialization || "General Coaching"}</p>
                  <p className="font-body text-sm text-on-surface-variant mt-3 line-clamp-3">{t.bio || "No biography provided."}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6.2 Attendance Logs View */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-headline text-2xl font-extrabold font-headline">Gym Check-in Attendance Logs</h2>
            <p className="font-body text-sm text-on-surface-variant mt-1">Logs of all checked-in members for workout sessions</p>
          </div>

          {attendanceList.length === 0 ? (
            <div className="glass-card rounded-lg p-6 text-center text-on-surface-variant font-body">No attendance logs.</div>
          ) : (
            <div className="glass-card border border-outline-variant/20 rounded-lg overflow-hidden">
              <table className="w-full text-left font-body border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant text-xs font-bold uppercase tracking-widest">
                    <th className="p-4">Member Name</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-sm">
                  {attendanceList.map((att) => (
                    <tr key={att.id} className="hover:bg-white/5 transition-all">
                      <td className="p-4 font-headline font-semibold text-on-surface">{att.members?.full_name || "Member Name"}</td>
                      <td className="p-4 uppercase text-xs font-semibold text-primary">{att.method}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 rounded-full uppercase">
                          {att.status}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant text-xs">{new Date(att.checkedInAt || att.checked_in_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
//  7. ANALYTICAL STATISTICS CARD COMPONENT
// ============================================================================
function StatCard({ title, value, icon, trend }: { title: string; value: string; icon: React.ReactNode; trend?: string }) {
  return (
    <div className="glass-card rounded-lg p-6 border border-outline-variant/20 relative flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div>
          <label className="block font-label text-[10px] font-extrabold tracking-widest text-on-surface-variant uppercase">{title}</label>
          <div className="font-headline text-3xl font-extrabold text-on-surface mt-2">{value}</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1 text-[11px] text-primary font-body font-semibold">
          <TrendingUp className="h-3 w-3" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
//  8. CUSTOMER DASHBOARD VIEW COMPONENT
// ============================================================================
function CustomerView({ user, setUser, showToast }: { user: any; setUser: any; showToast: any }) {
  const [gyms, setGyms] = useState<any[]>([]);
  const [joinRequest, setJoinRequest] = useState<any>(null);
  const [gymPlans, setGymPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [linkingGymId, setLinkingGymId] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, [user.gym_id]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      if (!user.gym_id) {
        const gymsRes = await api.get("/gyms/directory?limit=100");
        setGyms(gymsRes.data.data || []);

        const statusRes = await api.get("/gyms/join-request/status");
        setJoinRequest(statusRes.data.data || null);
      } else {
        const plansRes = await api.get(`/plans?gymId=${user.gym_id}`);
        setGymPlans(plansRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load customer dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGym = async (gymId: string) => {
    setLinkingGymId(gymId);
    try {
      const res = await api.post("/gyms/join-request", { gymId });
      setJoinRequest(res.data.data);
      showToast("Link request submitted successfully! Waiting for owner approval.", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to submit link request", "error");
    } finally {
      setLinkingGymId(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;
    setLoading(true);
    try {
      await api.patch(`/gyms/join-requests/${requestId}/reject`);
      setJoinRequest(null);
      showToast("Request cancelled successfully.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to cancel request", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckApproval = async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.data);
      if (res.data.data.gym_id) {
        showToast("Congratulations! Your link request has been approved!", "success");
      } else {
        const statusRes = await api.get("/gyms/join-request/status");
        setJoinRequest(statusRes.data.data || null);
        showToast("Request is still pending owner approval.", "info");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGyms = gyms.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.address && g.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading && gyms.length === 0 && gymPlans.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight">Customer Dashboard</h1>
        <p className="font-body text-base text-on-surface-variant mt-1">Manage your gym link and active memberships</p>
      </div>

      {!user.gym_id ? (
        <div className="space-y-8">
          {joinRequest ? (
            <div className="glass-card rounded-lg p-8 border border-primary/20 bg-primary/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/20 text-primary border border-primary/30">
                  Pending Approval
                </span>
                <h3 className="font-headline text-xl font-bold text-on-surface">Link Request Sent</h3>
                <p className="font-body text-sm text-on-surface-variant">
                  You requested to link with <span className="text-primary font-bold">{joinRequest.gyms?.name || "the gym"}</span> on{" "}
                  {new Date(joinRequest.created_at).toLocaleDateString()}. Waiting for the Gym Owner's review.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleCheckApproval}
                  className="px-6 py-3 bg-primary text-on-primary rounded-full font-headline font-bold text-sm shadow-primary transition-transform duration-200 active:scale-98 cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" /> Check Approval Status
                </button>
                <button
                  onClick={() => handleCancelRequest(joinRequest.id)}
                  className="px-6 py-3 bg-error/10 text-error border border-error/30 hover:bg-error/20 rounded-full font-headline font-bold text-sm transition-all duration-200 cursor-pointer"
                >
                  Cancel Request
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-headline text-xl font-bold text-on-surface">Select and Link your Gym</h2>
                <div className="w-full sm:w-80">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search gyms by name or city..."
                    className="w-full h-11 px-4 rounded-lg bg-surface-container border border-outline-variant/30 font-body text-sm text-on-surface focus:outline-none"
                  />
                </div>
              </div>

              {filteredGyms.length === 0 ? (
                <div className="glass-card rounded-lg p-10 text-center text-on-surface-variant font-body">
                  No active gyms found. Try adjusting your search query.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGyms.map((g) => (
                    <div key={g.id} className="glass-card rounded-lg overflow-hidden border border-outline-variant/20 flex flex-col justify-between p-6 space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-lg bg-surface-container border border-outline-variant/30 overflow-hidden flex items-center justify-center shrink-0">
                          {g.logoUrl ? (
                            <img src={g.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Dumbbell className="w-6 h-6 text-on-surface-variant" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-headline font-bold text-lg text-on-surface truncate">{g.name}</h3>
                          <p className="font-body text-xs text-on-surface-variant mt-1 truncate">{g.email || "No email"}</p>
                          <p className="font-body text-xs text-on-surface-variant truncate">{g.phone || "No phone"}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="font-label text-[9px] font-extrabold tracking-widest text-primary uppercase">Location</p>
                        <p className="font-body text-sm text-on-surface-variant line-clamp-2">{g.address || "No address provided."}</p>
                      </div>
                      <button
                        onClick={() => handleLinkGym(g.id)}
                        disabled={linkingGymId !== null}
                        className="w-full py-3 bg-primary text-on-primary rounded-full font-headline font-bold text-sm shadow-primary transition-transform duration-200 active:scale-98 disabled:opacity-50 cursor-pointer"
                      >
                        {linkingGymId === g.id ? "Linking..." : "Link to Gym"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 glass-card rounded-lg p-6 border border-outline-variant/20 h-fit space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-lg bg-surface-container border border-outline-variant/30 overflow-hidden flex items-center justify-center shadow-lg">
                <Dumbbell className="w-8 h-8 text-on-surface-variant" />
              </div>
              <div>
                <h3 className="font-headline text-xl font-bold text-on-surface">Linked to Gym</h3>
                <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                  Member Active
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-headline text-xl font-bold text-on-surface">Available Membership Plans</h2>
            {gymPlans.length === 0 ? (
              <div className="glass-card rounded-lg p-8 text-center text-on-surface-variant font-body">No plans are currently offered by this gym.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {gymPlans.map((p) => (
                  <div key={p.id} className="glass-card rounded-lg p-6 border border-outline-variant/20 flex flex-col justify-between space-y-6">
                    <div>
                      <h3 className="font-headline font-bold text-lg text-on-surface">{p.name}</h3>
                      <p className="font-body text-sm text-on-surface-variant mt-2">{p.description || "No description provided."}</p>
                    </div>
                    <div className="flex justify-between items-baseline gap-4 pt-4 border-t border-outline-variant/15">
                      <span className="font-headline font-extrabold text-2xl text-primary">₹{p.price}</span>
                      <span className="font-body text-xs text-on-surface-variant">for {p.durationDays} Days</span>
                    </div>
                    <button
                      onClick={() => showToast("Please use the Mobile App to complete Razorpay subscription checkouts!", "info")}
                      className="w-full py-3 bg-gradient-to-br from-primary to-tertiary text-on-primary rounded-full font-headline font-bold text-sm shadow-primary transition-transform duration-200 active:scale-98 cursor-pointer"
                    >
                      Subscribe on App
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
