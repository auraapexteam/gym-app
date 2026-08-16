import { BaseRepository } from '@/shared/repositories';
import { PaginatedResult } from '@/shared/types';
import { SubscriptionRow, SubscriptionDetailRow } from '@/modules/subscriptions/subscriptions.types';

const BASE_COLUMNS =
  'id, gym_id, member_id, plan_id, status, start_date, end_date, auto_renew, ' +
  'razorpay_subscription_id, cancelled_at, created_at, updated_at';

const DETAIL_SELECT =
  `${BASE_COLUMNS}, ` +
  'plan:plans(id, name, price, duration_days), ' +
  'member:members(id, profile_id, full_name, email, phone)';

export interface ListDetailedParams {
  gymId: string;
  page: number;
  limit: number;
  offset: number;
  sort: string;
  order: 'asc' | 'desc';
  status?: string;
  memberId?: string;
}

export class SubscriptionRepository extends BaseRepository<SubscriptionRow> {
  constructor() {
    super('subscriptions', { softDelete: false, defaultSelect: BASE_COLUMNS });
  }

  /** Fetch a single subscription with embedded plan and member. */
  async findDetailedById(id: string, gymId?: string): Promise<SubscriptionDetailRow | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.client.from('subscriptions').select(DETAIL_SELECT).eq('id', id);
    if (gymId) query = query.eq('gym_id', gymId);
    const { data, error } = await query.maybeSingle();
    if (error) this.fail('Failed to load subscription', error);
    return (data as SubscriptionDetailRow) ?? null;
  }

  /** Paginated, filtered subscription list with embedded relations. */
  async listDetailed(params: ListDetailedParams): Promise<PaginatedResult<SubscriptionDetailRow>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.client
      .from('subscriptions')
      .select(DETAIL_SELECT, { count: 'exact' })
      .eq('gym_id', params.gymId);

    if (params.status) query = query.eq('status', params.status);
    if (params.memberId) query = query.eq('member_id', params.memberId);

    query = query
      .order(params.sort, { ascending: params.order === 'asc' })
      .range(params.offset, params.offset + params.limit - 1);

    const { data, error, count } = await query;
    if (error) this.fail('Failed to list subscriptions', error);

    return {
      items: (data as SubscriptionDetailRow[]) ?? [],
      total: count ?? 0,
      page: params.page,
      limit: params.limit,
    };
  }

  /** The current active, non-expired subscription for a member, if any. */
  async findActiveForMember(gymId: string, memberId: string): Promise<SubscriptionRow | null> {
    const nowIso = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.client.from('subscriptions') as any)
      .select(BASE_COLUMNS)
      .eq('gym_id', gymId)
      .eq('member_id', memberId)
      .eq('status', 'active')
      .gte('end_date', nowIso)
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) this.fail('Failed to load active subscription', error);
    return (data as SubscriptionRow) ?? null;
  }

  /** All subscriptions belonging to the given member ids (across gyms). */
  async findByMemberIds(memberIds: string[]): Promise<SubscriptionDetailRow[]> {
    if (memberIds.length === 0) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.client.from('subscriptions') as any)
      .select(DETAIL_SELECT)
      .in('member_id', memberIds)
      .order('created_at', { ascending: false });
    if (error) this.fail('Failed to load member subscriptions', error);
    return (data as SubscriptionDetailRow[]) ?? [];
  }

  /** Atomically create an active subscription + a successful manual payment. */
  async createManualMembership(params: {
    gymId: string;
    memberId: string;
    planId: string;
    amount: number;
    durationDays: number;
    method: string;
  }): Promise<{ subscription_id: string; payment_id: string }> {
    const { data, error } = await this.client.rpc('create_manual_membership', {
      p_gym_id: params.gymId,
      p_member_id: params.memberId,
      p_plan_id: params.planId,
      p_amount: params.amount,
      p_duration_days: params.durationDays,
      p_method: params.method,
    });
    if (error) this.fail('Failed to create manual membership', error);
    const row = Array.isArray(data) ? data[0] : data;
    return row as { subscription_id: string; payment_id: string };
  }
}

export const subscriptionRepository = new SubscriptionRepository();
