import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, Mail, Lock, User, Phone } from 'lucide-react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api';
import { mockLogin } from '@/api/mockAuth';
import { useAuthStore } from '@/store';
import { toast } from 'sonner';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: Omit<RegisterForm, 'confirmPassword'>) => {
      try {
        const res = await authApi.register(data);
        return res.data.data;
      } catch {
        // Mock: treat registration as creating a gym_owner account
        return {
          user: {
            id: `u-${Date.now()}`,
            email: data.email,
            name: data.name,
            role: 'gym_owner' as const,
            phone: data.phone,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: `mock-token-${Date.now()}`,
        };
      }
    },
    onSuccess: ({ user, token }) => {
      setAuth(user, token);
      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Registration failed. Please try again.');
    },
  });

  const onSubmit = (data: RegisterForm) => {
    const { confirmPassword, ...payload } = data;
    mutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-aura-bg flex items-center justify-center p-6 bg-grid">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-aura-primary/3 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-md bg-aura-primary flex items-center justify-center">
            <Zap className="h-4 w-4 text-aura-bg" />
          </div>
          <span className="font-bold text-aura-text">Aura Apex</span>
        </div>

        <div className="bg-aura-card border border-aura-border rounded-lg p-8 shadow-aura-lg">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-aura-text mb-1">Create account</h1>
            <p className="text-aura-muted text-sm">Get started with Aura Apex today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-aura-text mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-aura-muted" />
                <input
                  {...register('name')}
                  placeholder="John Doe"
                  className="w-full bg-aura-bg border border-aura-border rounded-md pl-9 pr-4 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary focus:ring-1 focus:ring-aura-primary/30 transition-all"
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-aura-danger">{errors.name.message}</p>}
            </div>

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

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-aura-text mb-1.5">Phone number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-aura-muted" />
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="9876543210"
                  className="w-full bg-aura-bg border border-aura-border rounded-md pl-9 pr-4 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary focus:ring-1 focus:ring-aura-primary/30 transition-all"
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-aura-danger">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-aura-text mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-aura-muted" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className="w-full bg-aura-bg border border-aura-border rounded-md pl-9 pr-10 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary focus:ring-1 focus:ring-aura-primary/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-aura-muted hover:text-aura-text"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-aura-danger">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-aura-text mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-aura-muted" />
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat password"
                  className="w-full bg-aura-bg border border-aura-border rounded-md pl-9 pr-10 py-2.5 text-sm text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-primary focus:ring-1 focus:ring-aura-primary/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-aura-muted hover:text-aura-text"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-aura-danger">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-aura-primary text-aura-bg font-semibold py-2.5 rounded-md hover:bg-aura-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {mutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-aura-bg/30 border-t-aura-bg rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-aura-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-aura-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
