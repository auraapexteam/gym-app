import { env } from '@/config/env';

/**
 * Framework-level constants shared across the whole application.
 *
 * NOTE: Business/domain constants (e.g. attendance daily limits) live inside
 * their owning module's `*.constants.ts` file — never here.
 */

/** Mounted prefix for every versioned API route. */
export const API_PREFIX = `/api/${env.API_VERSION}`;

/** Pagination guard-rails applied by every list endpoint. */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/** Default sort applied when a request omits `sort`. */
export const DEFAULT_SORT = {
  COLUMN: 'created_at',
  ORDER: 'desc',
} as const;

/** Allowed image MIME types for uploads. Extensions are never trusted. */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_UPLOAD_SIZE_BYTES = env.MAX_UPLOAD_SIZE_BYTES;
