import { Response } from 'express';

/** Standard success envelope: `{ success, message, data, meta }`. */
export interface SuccessBody<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

/** Standard failure envelope: `{ success, message, error: { code } }`. */
export interface ErrorBody {
  success: false;
  message: string;
  error: {
    code: string;
    details?: unknown;
  };
}

/** Pagination metadata attached to list responses under `meta`. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Send a standardized success response. Controllers use these helpers
 * exclusively — they never write ad-hoc JSON shapes.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response {
  const body: SuccessBody<T> = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

/** Send a `201 Created` success response. */
export function sendCreated<T>(res: Response, data: T, message = 'Created successfully'): Response {
  return sendSuccess(res, data, message, 201);
}

/** Send a `204 No Content` response. */
export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}

/** Send a paginated list response with pagination metadata under `meta`. */
export function sendPaginated<T>(
  res: Response,
  items: T[],
  pagination: PaginationMeta,
  message = 'Fetched successfully',
): Response {
  return sendSuccess(res, items, message, 200, { pagination });
}
