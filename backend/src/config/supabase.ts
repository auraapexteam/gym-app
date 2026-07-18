import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

/**
 * Supabase admin client (service-role).
 *
 * Used exclusively by the repository layer for privileged, server-side data
 * access. It bypasses Row Level Security by design — tenant isolation is
 * therefore enforced in the application layer (repositories always scope
 * queries by `gym_id`). This key must NEVER be exposed to any client.
 */
export const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

/**
 * Supabase "anon" client.
 *
 * Used for public auth operations (login / signup / password reset). Prefers
 * the anon key; falls back to the service-role key when the anon key is not
 * configured (auth endpoints accept either). Business data is never read here.
 */
export const supabaseAnon: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
