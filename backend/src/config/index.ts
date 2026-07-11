/**
 * Public config surface. Initialization only — never business logic.
 */
export { env, isProduction, isTest, isRazorpayConfigured, type Env } from '@/config/env';
export { logger, type Logger } from '@/config/logger';
export { supabase, supabaseAnon } from '@/config/supabase';
export { getRazorpayClient } from '@/config/razorpay';
export * from '@/config/constants';
