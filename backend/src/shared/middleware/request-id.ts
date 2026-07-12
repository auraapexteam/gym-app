import { randomUUID } from 'crypto';
import { RequestHandler } from 'express';

/**
 * Assigns a correlation id to every request (honoring an inbound
 * `X-Request-Id` when present) and echoes it back on the response. Used to
 * trace a single request across logs.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.headers['x-request-id'];
  const id = typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};
