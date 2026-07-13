import { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors';
import { UserContext } from '@/shared/types';

/** Return the authenticated user context, or throw if the route was not protected. */
export function currentUser(req: Request): UserContext {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

/** Best-effort client IP for audit logging (honors a single proxy hop). */
export function clientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress ?? null;
}
