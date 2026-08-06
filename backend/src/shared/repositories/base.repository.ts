import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/config/supabase';
import { AppError, ConflictError } from '@/shared/errors';
import { PaginatedResult } from '@/shared/types';

export interface BaseRepositoryOptions {
  /** Column used to scope rows to a tenant. Defaults to `gym_id`. */
  tenantColumn?: string;
  /** When true, reads exclude `deleted_at IS NOT NULL` and deletes are soft. */
  softDelete?: boolean;
  /** Default column projection. Prefer explicit columns over `*`. */
  defaultSelect?: string;
}

export interface FindManyParams {
  gymId?: string | null;
  page: number;
  limit: number;
  offset: number;
  sort: string;
  order: 'asc' | 'desc';
  search?: string;
  /** Columns searched with case-insensitive partial match. */
  searchColumns?: string[];
  /** Equality/`IN` filters applied to the query. */
  filters?: Record<string, unknown>;
  /** Override projection for this query. */
  select?: string;
}

/**
 * Generic, tenant-aware persistence base class.
 *
 * Concrete repositories extend this and add intent-revealing methods
 * (`findByEmail`, `findActivePlan`, ...). Business rules never live here — the
 * repository only reads and writes rows, automatically enforcing tenant
 * scoping and soft-delete visibility.
 */
export abstract class BaseRepository<TRow extends { id: string }> {
  protected readonly client: SupabaseClient = supabase;
  protected readonly tenantColumn: string;
  protected readonly softDelete: boolean;
  protected readonly defaultSelect: string;

  protected constructor(
    protected readonly table: string,
    options: BaseRepositoryOptions = {},
  ) {
    this.tenantColumn = options.tenantColumn ?? 'gym_id';
    this.softDelete = options.softDelete ?? false;
    this.defaultSelect = options.defaultSelect ?? '*';
  }

  /** Translate a Postgrest error into a logged, non-operational AppError. */
  protected fail(message: string, cause: unknown): never {
    const errorObj = cause as any;
    if (errorObj && (errorObj.code === '23505' || errorObj.message?.includes('uq_') || errorObj.message?.includes('unique'))) {
      throw new ConflictError(
        errorObj.details || errorObj.message || 'Duplicate record found',
        errorObj.message?.includes('uq_attendance') || errorObj.details?.includes('uq_attendance') || message.toLowerCase().includes('attendance')
          ? 'ALREADY_CHECKED_IN'
          : 'DUPLICATE_RECORD',
      );
    }
    throw new AppError(
      message,
      500,
      'DB_ERROR',
      false,
      cause instanceof Error ? cause.message : cause,
    );
  }

  /** Find a single row by primary key, scoped to a tenant when provided. */
  async findById(id: string, gymId?: string | null, select?: string): Promise<TRow | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.client.from(this.table).select(select ?? this.defaultSelect).eq('id', id);
    if (gymId !== undefined) query = query.eq(this.tenantColumn, gymId || '00000000-0000-0000-0000-000000000000');
    if (this.softDelete) query = query.is('deleted_at', null);

    const { data, error } = await query.maybeSingle();
    if (error) this.fail(`Failed to load ${this.table} by id`, error);
    return (data as TRow) ?? null;
  }

  /** Find the first row matching a single column equality filter. */
  async findOneBy(column: string, value: unknown, gymId?: string | null): Promise<TRow | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.client.from(this.table).select(this.defaultSelect).eq(column, value);
    if (gymId !== undefined) query = query.eq(this.tenantColumn, gymId || '00000000-0000-0000-0000-000000000000');
    if (this.softDelete) query = query.is('deleted_at', null);

    const { data, error } = await query.limit(1).maybeSingle();
    if (error) this.fail(`Failed to load ${this.table} by ${column}`, error);
    return (data as TRow) ?? null;
  }

  /** Paginated, filtered, sorted read. Returns items plus total count. */
  async findMany(params: FindManyParams): Promise<PaginatedResult<TRow>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.client
      .from(this.table)
      .select(params.select ?? this.defaultSelect, { count: 'exact' });

    if (params.gymId !== undefined) query = query.eq(this.tenantColumn, params.gymId || '00000000-0000-0000-0000-000000000000');
    if (this.softDelete) query = query.is('deleted_at', null);

    query = this.applyFilters(query, params.filters);
    query = this.applySearch(query, params.search, params.searchColumns);

    query = query
      .order(params.sort, { ascending: params.order === 'asc' })
      .range(params.offset, params.offset + params.limit - 1);

    const { data, error, count } = await query;
    if (error) this.fail(`Failed to list ${this.table}`, error);

    return {
      items: (data as TRow[]) ?? [],
      total: count ?? 0,
      page: params.page,
      limit: params.limit,
    };
  }

  /** Count rows matching optional filters, scoped to a tenant when provided. */
  async count(gymId?: string | null, filters?: Record<string, unknown>): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.client.from(this.table).select('id', { count: 'exact', head: true });
    if (gymId !== undefined) query = query.eq(this.tenantColumn, gymId || '00000000-0000-0000-0000-000000000000');
    if (this.softDelete) query = query.is('deleted_at', null);
    query = this.applyFilters(query, filters);

    const { error, count } = await query;
    if (error) this.fail(`Failed to count ${this.table}`, error);
    return count ?? 0;
  }

  /** Insert a single row and return it. */
  async create(payload: Partial<TRow>): Promise<TRow> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.client.from(this.table) as any)
      .insert(payload)
      .select(this.defaultSelect)
      .single();
    if (error) this.fail(`Failed to create ${this.table}`, error);
    return data as TRow;
  }

  /** Insert multiple rows in one statement and return them. */
  async createMany(payloads: Partial<TRow>[]): Promise<TRow[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.client.from(this.table) as any)
      .insert(payloads)
      .select(this.defaultSelect);
    if (error) this.fail(`Failed to bulk create ${this.table}`, error);
    return (data as TRow[]) ?? [];
  }

  /** Patch a row by id (tenant-scoped when provided) and return the result. */
  async update(id: string, patch: Partial<TRow>, gymId?: string | null): Promise<TRow | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = (this.client.from(this.table) as any).update(patch).eq('id', id);
    if (gymId !== undefined) query = query.eq(this.tenantColumn, gymId || '00000000-0000-0000-0000-000000000000');
    if (this.softDelete) query = query.is('deleted_at', null);

    const { data, error } = await query.select(this.defaultSelect).maybeSingle();
    if (error) this.fail(`Failed to update ${this.table}`, error);
    return (data as TRow) ?? null;
  }

  /** Soft-delete (sets `deleted_at`) when enabled, otherwise hard-delete. */
  async remove(id: string, gymId?: string | null): Promise<boolean> {
    if (this.softDelete) {
      const updated = await this.update(
        id,
        { deleted_at: new Date().toISOString() } as unknown as Partial<TRow>,
        gymId,
      );
      return updated !== null;
    }
    return this.hardDelete(id, gymId);
  }

  /** Permanently delete a row. Use only where legally/operationally required. */
  async hardDelete(id: string, gymId?: string | null): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.client.from(this.table).delete().eq('id', id);
    if (gymId !== undefined) query = query.eq(this.tenantColumn, gymId || '00000000-0000-0000-0000-000000000000');

    const { error, count } = await query.select('id', { count: 'exact' });
    if (error) this.fail(`Failed to delete ${this.table}`, error);
    return (count ?? 0) > 0;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyFilters(query: any, filters?: Record<string, unknown>): any {
    if (!filters) return query;
    for (const [column, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue;
      query = Array.isArray(value) ? query.in(column, value) : query.eq(column, value);
    }
    return query;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applySearch(query: any, search?: string, columns?: string[]): any {
    if (!search || !columns || columns.length === 0) return query;
    // Strip characters that carry meaning in Postgrest's `or` filter DSL.
    const term = search.replace(/[,()%*]/g, ' ').trim();
    if (!term) return query;
    const orFilter = columns.map((col) => `${col}.ilike.%${term}%`).join(',');
    return query.or(orFilter);
  }
}
