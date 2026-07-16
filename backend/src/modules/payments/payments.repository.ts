import { BaseRepository } from '@/shared/repositories';
import { PaginatedResult } from '@/shared/types';
import { PaymentRow, OrderContext } from '@/modules/payments/payments.types';

const PAYMENT_COLUMNS =
  'id, gym_id, subscription_id, member_id, amount, currency, status, method, ' +
  'razorpay_order_id, razorpay_payment_id, paid_at, created_at, updated_at';

export interface ListPaymentsParams {
  gymId: string;
  page: number;
  limit: number;
  offset: number;
  sort: string;
  order: 'asc' | 'desc';
  status?: string;
  memberId?: string;
}

export class PaymentRepository extends BaseRepository<PaymentRow> {
  constructor() {
    super('payments', { softDelete: false, defaultSelect: PAYMENT_COLUMNS });
  }

  findByOrderId(orderId: string): Promise<PaymentRow | null> {
    return this.findOneBy('razorpay_order_id', orderId);
  }

  async list(params: ListPaymentsParams): Promise<PaginatedResult<PaymentRow>> {
    return this.findMany({
      gymId: params.gymId,
      page: params.page,
      limit: params.limit,
      offset: params.offset,
      sort: params.sort,
      order: params.order,
      filters: {
        status: params.status,
        member_id: params.memberId,
      },
    });
  }

  /** Resolve the order/subscription/plan context needed to confirm a payment. */
  async findOrderContext(orderId: string): Promise<OrderContext | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.client.from('payments') as any)
      .select('id, gym_id, member_id, status, subscription:subscriptions(id, plan:plans(duration_days))')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();
    if (error) this.fail('Failed to load order context', error);
    if (!data) return null;

    return {
      paymentId: data.id,
      subscriptionId: data.subscription?.id ?? null,
      gymId: data.gym_id,
      memberId: data.member_id,
      status: data.status,
      durationDays: data.subscription?.plan?.duration_days ?? 0,
    };
  }

  /** Atomically create the pending subscription + created payment for a checkout. */
  async createMembershipOrder(params: {
    gymId: string;
    memberId: string;
    planId: string;
    amount: number;
    currency: string;
    razorpayOrderId: string;
  }): Promise<{ subscription_id: string; payment_id: string }> {
    const { data, error } = await this.client.rpc('create_membership_order', {
      p_gym_id: params.gymId,
      p_member_id: params.memberId,
      p_plan_id: params.planId,
      p_amount: params.amount,
      p_currency: params.currency,
      p_razorpay_order_id: params.razorpayOrderId,
    });
    if (error) this.fail('Failed to create membership order', error);
    const row = Array.isArray(data) ? data[0] : data;
    return row as { subscription_id: string; payment_id: string };
  }

  /** Atomically & idempotently mark a payment successful and activate its subscription. */
  async confirmMembershipPayment(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    signature: string | null;
    method: string | null;
    durationDays: number;
  }): Promise<{ subscription_id: string; payment_id: string; already_processed: boolean }> {
    const { data, error } = await this.client.rpc('confirm_membership_payment', {
      p_razorpay_order_id: params.razorpayOrderId,
      p_razorpay_payment_id: params.razorpayPaymentId,
      p_signature: params.signature,
      p_method: params.method,
      p_duration_days: params.durationDays,
    });
    if (error) this.fail('Failed to confirm membership payment', error);
    const row = Array.isArray(data) ? data[0] : data;
    return row as { subscription_id: string; payment_id: string; already_processed: boolean };
  }

  /** Mark a payment as failed (webhook path). */
  async markFailedByOrderId(orderId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (this.client.from('payments') as any)
      .update({ status: 'failed' })
      .eq('razorpay_order_id', orderId)
      .neq('status', 'success');
    if (error) this.fail('Failed to mark payment failed', error);
  }
}

export const paymentRepository = new PaymentRepository();
