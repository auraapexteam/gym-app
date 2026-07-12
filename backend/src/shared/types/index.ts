import { Role, Permission } from '@/shared/rbac';

/** Account lifecycle status shared by profiles and gyms. */
export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

/**
 * Authenticated user context attached to every protected request by the
 * authentication middleware. Controllers and services derive identity, tenant,
 * and permissions from here — never from client-supplied body/query/headers.
 */
export interface UserContext {
  id: string;
  email: string;
  role: Role;
  gymId: string | null;
  status: AccountStatus;
  permissions: Permission[];
}

/** Normalized list-query parameters produced by the pagination helper. */
export interface ListQuery {
  page: number;
  limit: number;
  offset: number;
  sort: string;
  order: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

/** Repository result for a paginated read. */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/** Sort direction literal. */
export type SortOrder = 'asc' | 'desc';
