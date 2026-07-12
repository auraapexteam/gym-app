import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import { env } from '@/config/env';

/** Applies OWASP-recommended security response headers globally. */
export const securityHeaders = helmet();

/** gzip/brotli response compression for text/JSON payloads. */
export const responseCompression = compression();

const allowedOrigins = env.ALLOWED_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * CORS policy restricted to the configured origins. Requests without an
 * `Origin` header (native mobile apps, server-to-server, curl) are allowed;
 * browser origins must be explicitly whitelisted.
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS policy'));
  },
  credentials: true,
});
