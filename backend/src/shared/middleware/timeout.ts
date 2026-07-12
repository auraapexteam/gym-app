import { RequestHandler } from 'express';

/**
 * Guards against requests hanging indefinitely. If a response has not been
 * sent within `ms`, a 503 is returned. Long-running work must move to
 * background jobs rather than extend this window.
 */
export const requestTimeout = (ms: number): RequestHandler => {
  return (req, res, next) => {
    res.setTimeout(ms, () => {
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          message: 'Request timed out',
          error: { code: 'REQUEST_TIMEOUT' },
        });
      }
    });
    next();
  };
};
