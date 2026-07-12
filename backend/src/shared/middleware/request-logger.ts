import pinoHttp from 'pino-http';
import { logger } from '@/config/logger';

/**
 * Structured per-request logging. Attaches request id, user id and gym id to
 * every log line and skips health probes to avoid log noise.
 */
export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => (req as { id?: string }).id ?? '',
  customProps: (req) => {
    const user = (req as { user?: { id: string; gymId: string | null } }).user;
    return { userId: user?.id, gymId: user?.gymId };
  },
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/ready' || req.url === '/live',
  },
});
