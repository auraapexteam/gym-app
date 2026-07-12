import { UserContext } from '@/shared/types';

/**
 * Augments the Express Request with the fields our middleware attaches:
 * - `id`      : correlation id set by the request-id middleware
 * - `user`    : authenticated user context set by the auth middleware
 * - `rawBody` : raw request body preserved for webhook signature verification
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id: string;
      user?: UserContext;
      rawBody?: string;
    }
  }
}

export {};
