import { PAGINATION, DEFAULT_SORT } from '@/config/constants';
import { ListQuery, SortOrder } from '@/shared/types';
import { PaginationMeta } from '@/shared/responses';

/**
 * Normalize raw request query parameters into a safe, bounded `ListQuery`.
 * Guarantees sane defaults and enforces the maximum page size so a client can
 * never request an unbounded result set.
 */
export function parseListQuery(query: Record<string, unknown>): ListQuery {
  const rawPage = Number(query.page);
  const rawLimit = Number(query.limit);

  const page =
    Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : PAGINATION.DEFAULT_PAGE;

  let limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : PAGINATION.DEFAULT_LIMIT;
  limit = Math.min(limit, PAGINATION.MAX_LIMIT);

  const sort =
    typeof query.sort === 'string' && query.sort.length > 0 ? query.sort : DEFAULT_SORT.COLUMN;

  const order: SortOrder =
    query.order === 'asc' ? 'asc' : query.order === 'desc' ? 'desc' : (DEFAULT_SORT.ORDER as SortOrder);

  const search =
    typeof query.search === 'string' && query.search.trim().length > 0
      ? query.search.trim()
      : undefined;

  return { page, limit, offset: (page - 1) * limit, sort, order, search };
}

/** Build the pagination metadata block returned under `meta.pagination`. */
export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
