import { RequestHandler } from 'express';
import { NotFoundError } from '@/shared/errors';

/** Terminal handler for unmatched routes; forwards a 404 to the error handler. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
};
