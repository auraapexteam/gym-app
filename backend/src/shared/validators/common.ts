import { z } from 'zod';
import { PAGINATION } from '@/config/constants';

/** A UUID string. */
export const uuidSchema = z.string().uuid();

/** Reusable `params: { id }` validation for `/:id` routes. */
export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid('id must be a valid UUID') }),
});

/** Reusable list-query validation (page/limit/sort/order/search). */
export const listQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).optional(),
    sort: z.string().max(64).optional(),
    order: z.enum(['asc', 'desc']).optional(),
    search: z.string().max(200).optional(),
  }),
});

/** Merge helper: combine the list-query shape with extra query fields. */
export const withListQuery = <T extends z.ZodRawShape>(extra: T) =>
  z.object({
    query: z
      .object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).optional(),
        sort: z.string().max(64).optional(),
        order: z.enum(['asc', 'desc']).optional(),
        search: z.string().max(200).optional(),
      })
      .extend(extra),
  });
