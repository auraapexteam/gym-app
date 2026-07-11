import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Centralized, validated environment configuration.
 *
 * This is the ONLY place in the codebase permitted to read `process.env`.
 * Every other module imports the typed, frozen `env` object.
 *
 * Missing or malformed critical variables fail startup immediately so the
 * server never boots in a partially-configured state.
 */
const envSchema = z.object({
  // Runtime
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_VERSION: z.string().default('v1'),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),

  // HTTP
  ALLOWED_ORIGINS: z.string().default('*'),
  JSON_BODY_LIMIT: z.string().default('1mb'),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  // Supabase (required — the platform cannot run without a database/auth provider)
  SUPABASE_URL: z.string().url({ message: 'SUPABASE_URL must be a valid URL' }),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  SUPABASE_STORAGE_BUCKET: z.string().default('gym-media'),

  // Razorpay (optional — payment endpoints degrade gracefully when unset)
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Uploads
  MAX_UPLOAD_SIZE_BYTES: z.coerce.number().int().positive().default(5_242_880), // 5 MB
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Cannot use the structured logger here — it depends on env being loaded.
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console
    console.error(`   • ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = Object.freeze(parsed.data);

export type Env = typeof env;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isRazorpayConfigured = Boolean(
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET,
);
