import { ErrorRequestHandler } from 'express';
import { logger } from '@/config/logger';
import { isProduction } from '@/config/env';
import { AppError } from '@/shared/errors';
import { ErrorBody } from '@/shared/responses';

/**
 * Global error handler — the single place that converts thrown errors into the
 * standard failure response shape.
 *
 * Operational errors (AppError) return their client-safe message and stable
 * code. Unexpected errors are logged with full context and returned as an
 * opaque 500 so internal details (stack traces, SQL, paths) never leak.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const isApp = err instanceof AppError;
  const statusCode = isApp ? err.statusCode : 500;
  const code = isApp ? err.code : 'INTERNAL_ERROR';
  const operational = isApp ? err.isOperational : false;

  if (!operational) {
    logger.error({ err, reqId: req.id, path: req.originalUrl }, 'Unhandled error');
  } else {
    logger.debug({ code, reqId: req.id, path: req.originalUrl }, 'Operational error');
  }

  const body: ErrorBody = {
    success: false,
    message: operational ? err.message : 'Something went wrong on the server',
    error: { code },
  };

  if (isApp && operational && err.details !== undefined) {
    body.error.details = err.details;
  }

  // Never expose stack traces in production.
  if (!operational && !isProduction && err instanceof Error) {
    body.error.details = err.stack;
  }

  res.status(statusCode).json(body);
};
