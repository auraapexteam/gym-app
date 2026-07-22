import express, { Application } from 'express';
import cookieParser from 'cookie-parser';

import { env, API_PREFIX } from '@/config';
import apiRouter from '@/routes';
import { docsRouter } from '@/docs';
import { healthRoutes } from '@/modules/health';
import { webhookRouter } from '@/modules/payments';
import {
  requestId,
  securityHeaders,
  responseCompression,
  corsMiddleware,
  requestLogger,
  requestTimeout,
  generalRateLimiter,
  notFoundHandler,
  errorHandler,
} from '@/shared/middleware';

/**
 * Builds and configures the Express application.
 *
 * Middleware order is intentional and matches the documented request lifecycle:
 *   request-id → security headers → compression → CORS → (webhooks raw) →
 *   JSON parser → cookies → request logger → timeout → rate limiter → routes →
 *   404 → global error handler.
 */
export function createApp(): Application {
  const app = express();

  // Trust the first proxy hop (Railway / Cloudflare) for correct client IPs.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Cross-cutting middleware (pre-body).
  app.use(requestId);
  app.use(securityHeaders);
  app.use(responseCompression);
  app.use(corsMiddleware);

  // Health/readiness/liveness probes — mounted before logging & rate limiting.
  app.use(healthRoutes);

  // Razorpay webhook: raw body + HMAC auth, BEFORE the JSON parser so the exact
  // payload bytes are available for signature verification.
  app.use('/webhooks', express.raw({ type: '*/*' }), webhookRouter);

  // Body parsing & logging.
  app.use(express.json({ limit: env.JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: env.JSON_BODY_LIMIT }));
  app.use(cookieParser());
  app.use(requestLogger);
  app.use(requestTimeout(env.REQUEST_TIMEOUT_MS));
  app.use(generalRateLimiter);

  // OpenAPI docs — publicly accessible, no auth required.
  app.use('/docs', docsRouter);

  // Versioned API.
  app.use(API_PREFIX, apiRouter);

  // Terminal handlers.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp();
