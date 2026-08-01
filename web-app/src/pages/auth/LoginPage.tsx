import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api';
import { mockLogin } from '@/api/mockAuth';
import { useAuthStore } from '@/store';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

// Demo credentials display
const demoRoles = [
  { role: 'Super Admin', email: 'superadmin@auraaapex.com', password: 'Demo@123' },
  { role: 'Gym Owner',   email: 'owner@auraaapex.com',      password: 'Demo@123' },
  { role: 'Staff',       email: 'staff@auraaapex.com',      password: 'Demo@123' },
  { role: 'Trainer',     email: 'trainer@auraaapex.com',    password: 'Demo@123' },
  { role: 'Customer',    email: 'customer@auraaapex.com',   password: 'Demo@123' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      try {
        // Try real API first
        const res = await authApi.login(data);
        return res.data.data;
      } catch {
        // Fall back to mock auth (for demo / no backend)
        return mockLogin(data.email, data.password);
      }
    },
    onSuccess: ({ user, token }) => {
      setAuth(user, token);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard', { replace: true });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Invalid credentials. Please try again.');
    },
  });

  return (
    <div className="min-h-screen bg-aura-bg flex bg-grid">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-aura-card border-r border-aura-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-aura-primary flex items-center justify-center">
            <Zap className="h-5 w-5 text-aura-bg" />
          </div>
          <span className="font-bold text-xl text-aura-text">Aura Apex</span>
        </div>

        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-aura-text leading-tight mb-4">
              Manage your gym<br />
              <span className="gradient-text">smarter, faster.</span>
            </h2>
            <p className="text-aura-muted text-lg leading-relaxed">
              Complete gym management with memberships, nutrition, trainers, and analytics — all in one place.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-8 grid grid-cols-2 gap-3"
          >
            {[
              { label: 'Active Members', value: '12,400+' },
              { label: 'Gyms Managed', value: '340+' },
              { label: 'Revenue Tracked', value: '₹2.4Cr+' },
              { label: 'Daily Check-ins', value: '8,900+' },
            ].map((stat) => (
              <div key={stat.label} className="bg-aura-bg border border-aura-border rounded-lg p-4">
                <p className="text-xl font-bold text-aura-primary">{stat.value}</p>
                <p className="text-xs text-aura-muted mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="text-xs text-aura-muted">© 2025 Aura Apex · All rights reserved</p>
      </div>

      {/* Right panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-md bg-aura-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-aura-bg" />
            </div>
            <span className="font-bold text-aura-text">Aura Apex</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-aura-text mb-1">Welcome back</h1>
            <p className="text-aura-muted text-sm">Sign in to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-aura-text mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-aura-muted" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@gym.com"
                  className="w-full bg-aura-bg border border-aura-border rounded-md pl-9 pr-4 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary focus:ring-1 focus:ring-aura-primary/30 transition-all"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-aura-danger">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-aura-text">Password</label>
                <Link to="/forgot-password" className="text-xs text-aura-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-aura-muted" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-aura-bg border border-aura-border rounded-md pl-9 pr-10 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary focus:ring-1 focus:ring-aura-primary/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-aura-muted hover:text-aura-text transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-aura-danger">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-aura-primary text-aura-bg font-semibold py-2.5 rounded-md hover:bg-aura-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-aura-bg/30 border-t-aura-bg rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-aura-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-aura-primary hover:underline font-medium">
              Create account
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-aura-card border border-aura-border rounded-lg">
            <p className="text-xs font-semibold text-aura-muted uppercase tracking-wider mb-3">
              Demo Credentials
            </p>
            <div className="space-y-2">
              {demoRoles.map((d) => (
                <button
                  key={d.role}
                  onClick={() => {
                    setValue('email', d.email);
                    setValue('password', d.password);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-aura-bg hover:bg-aura-border/50 transition-colors text-left"
                >
                  <span className="text-xs font-medium text-aura-text">{d.role}</span>
                  <span className="text-xs text-aura-muted">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
