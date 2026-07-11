import pino from 'pino';
import { env, isProduction } from '@/config/env';

/**
 * Structured application logger (Pino).
 *
 * - Pretty-printed and colorized in development for readability.
 * - Machine-readable JSON in production for log aggregation.
 * - Redacts sensitive fields so secrets/tokens never reach the log stream.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      '*.razorpay_signature',
      '*.signature',
      'SUPABASE_SERVICE_ROLE_KEY',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
    ],
    censor: '[REDACTED]',
  },
  transport: !isProduction
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export type Logger = typeof logger;
