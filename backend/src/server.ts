import { createServer } from 'http';
// Trigger rebuild for Render
import app from '@/app';
import { env, API_PREFIX } from '@/config';
import { logger } from '@/config/logger';

/**
 * HTTP server bootstrap and graceful shutdown.
 *
 * `env` is validated at import time and fails fast on misconfiguration, so by
 * the time we listen the process is fully configured.
 */
const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info(
    {
      event:          'server_started',
      port:           env.PORT,
      env:            env.NODE_ENV,
      api:            API_PREFIX,
      docs:           `http://localhost:${env.PORT}/docs`,
      allowedOrigins: env.ALLOWED_ORIGINS,
      logLevel:       env.LOG_LEVEL,
    },
    '🚀 Aura Apex API is running',
  );
});

/** Drain in-flight requests, then exit. Forced exit after a grace window. */
function shutdown(signal: string): void {
  logger.info({ signal }, 'Shutting down gracefully...');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception — exiting');
  process.exit(1);
});

export default server;
