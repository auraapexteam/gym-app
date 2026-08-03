import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Zap, ArrowLeft, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => authApi.forgotPassword(data.email),
    onSuccess: () => setSent(true),
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to send reset email.');
    },
  });

  return (
    <div className="min-h-screen bg-aura-bg flex items-center justify-center p-6 bg-grid">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-md bg-aura-primary flex items-center justify-center">
            <Zap className="h-4 w-4 text-aura-bg" />
          </div>
          <span className="font-bold text-aura-text">Aura Apex</span>
        </div>

        <div className="bg-aura-card border border-aura-border rounded-lg p-8 shadow-aura-lg">
          {sent ? (
            <div className="text-center py-4">
              <div className="h-16 w-16 rounded-full bg-aura-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-aura-success" />
              </div>
              <h2 className="text-xl font-bold text-aura-text mb-2">Check your email</h2>
              <p className="text-aura-muted text-sm mb-6">
                We've sent a password reset link to your email address. It will expire in 15 minutes.
              </p>
              <Link to="/login" className="text-aura-primary hover:underline text-sm font-medium">
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-aura-text mb-1">Forgot password?</h1>
                <p className="text-aura-muted text-sm">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full bg-aura-primary text-aura-bg font-semibold py-2.5 rounded-md hover:bg-aura-primary/90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {mutation.isPending ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 mt-5 text-sm text-aura-muted hover:text-aura-text transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
