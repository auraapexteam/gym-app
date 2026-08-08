import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { supabase } from '@/config/supabase';
import { paymentRepository } from '@/modules/payments/payments.repository';
import { RazorpayService } from '@/modules/payments/razorpay.service';
import { toPaymentDto } from '@/modules/payments/payments.dto';
import {
  DEFAULT_CURRENCY,
  NormalizedPaymentMethod,
  mapRazorpayMethod,
} from '@/modules/payments/payments.constants';
import {
  CheckoutOrderDto,
  CreateOrderInput,
  PaymentDto,
  RazorpayWebhookEvent,
  VerifyPaymentInput,
} from '@/modules/payments/payments.types';
import { PlanService } from '@/modules/plans';
import { MemberService } from '@/modules/members';
import { SubscriptionService } from '@/modules/subscriptions';
import { Role } from '@/shared/rbac';
import { ListQuery, PaginatedResult, UserContext } from '@/shared/types';
import {
  BadRequestError,
  BusinessRuleError,
  NotFoundError,
  PaymentError,
} from '@/shared/errors';
import { generateOpaqueToken } from '@/shared/utils';

export interface VerifyResult {
  subscriptionId: string;
  paymentId: string;
  status: 'success';
  alreadyProcessed: boolean;
}

/**
 * Payment module — the financial source of truth. It creates Razorpay orders,
 * verifies signatures, and confirms payments (which atomically activates the
 * associated subscription via a DB transaction). The webhook, not the client,
 * is authoritative; the verify endpoint is a fast path that the webhook backs up.
 */
export class PaymentService {
  /** Start a checkout: create a Razorpay order + pending subscription + payment. */
  static async createOrder(user: UserContext, input: CreateOrderInput): Promise<CheckoutOrderDto> {
    const plan = await PlanService.getPurchasable(input.planId);
    const gymId = plan.gym_id;
    const memberId = await this.resolveMemberId(user, gymId, input.memberId);

    const amount = Number(plan.price);
    const order = await RazorpayService.createOrder({
      amount,
      currency: DEFAULT_CURRENCY,
      receipt: `rcpt_${generateOpaqueToken(8)}`,
      notes: { planId: plan.id, gymId, memberId },
    });

    const { subscription_id, payment_id } = await paymentRepository.createMembershipOrder({
      gymId,
      memberId,
      planId: plan.id,
      amount,
      currency: DEFAULT_CURRENCY,
      razorpayOrderId: order.id,
    });

    return {
      orderId: order.id,
      amount,
      amountInPaise: order.amount,
      currency: order.currency,
      razorpayKeyId: env.RAZORPAY_KEY_ID ?? '',
      subscriptionId: subscription_id,
      paymentId: payment_id,
      planName: plan.name,
    };
  }

  /** Verify the client's checkout signature and confirm the payment. */
  static async verify(input: VerifyPaymentInput): Promise<VerifyResult> {
    const valid = RazorpayService.verifyPaymentSignature(
      input.orderId,
      input.paymentId,
      input.signature,
    );
    if (!valid) {
      throw new PaymentError('Invalid payment signature', 'INVALID_SIGNATURE');
    }

    const ctx = await paymentRepository.findOrderContext(input.orderId);
    if (!ctx) throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND');

    const result = await paymentRepository.confirmMembershipPayment({
      razorpayOrderId: input.orderId,
      razorpayPaymentId: input.paymentId,
      signature: input.signature,
      method: null,
      durationDays: ctx.durationDays,
    });

    if (ctx.gymId && ctx.memberId) {
      await this.handlePostPaymentAutoJoin(ctx.gymId, ctx.memberId);
    }

    return {
      subscriptionId: result.subscription_id,
      paymentId: result.payment_id,
      status: 'success',
      alreadyProcessed: result.already_processed,
    };
  }

  /** Confirm a payment from a verified webhook (idempotent, authoritative). */
  static async confirmFromWebhook(
    orderId: string,
    paymentId: string,
    method: NormalizedPaymentMethod | null,
  ): Promise<void> {
    const ctx = await paymentRepository.findOrderContext(orderId);
    if (!ctx) {
      logger.warn({ orderId }, 'Webhook for unknown order — ignoring');
      return;
    }
    await paymentRepository.confirmMembershipPayment({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      signature: null,
      method,
      durationDays: ctx.durationDays,
    });

    if (ctx.gymId && ctx.memberId) {
      await this.handlePostPaymentAutoJoin(ctx.gymId, ctx.memberId);
    }
  }

  /** Mark a payment failed from a verified webhook. */
  static async markFailed(orderId: string): Promise<void> {
    await paymentRepository.markFailedByOrderId(orderId);
  }

  /**
   * Dispatch a signature-verified Razorpay webhook event. The webhook is the
   * authoritative source of truth for payment state; processing is idempotent so
   * replayed events never double-apply.
   */
  static async handleWebhookEvent(event: RazorpayWebhookEvent): Promise<void> {
    const eventId = event.id ?? (event as any).event_id;
    if (!eventId) {
      logger.warn('Webhook event missing id');
      return;
    }

    // 1. Idempotency Check: check if event already processed
    const { data: existingEvent } = await supabase
      .from('payment_events')
      .select('status')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingEvent?.status === 'processed') {
      logger.info({ eventId }, 'Payment webhook event already processed (idempotent skip)');
      return;
    }

    if (!existingEvent) {
      await supabase
        .from('payment_events')
        .insert({
          event_id: eventId,
          event_type: event.event,
          payload: event,
          status: 'pending',
        });
    }

    const payment = event.payload?.payment?.entity;
    try {
      switch (event.event) {
        case 'order.paid':
        case 'payment.captured': {
          const orderId = payment?.order_id ?? event.payload?.order?.entity?.id;
          if (orderId && payment?.id) {
            // Verify status directly from Razorpay API before activating subscription
            const rpPayment = await RazorpayService.fetchPayment(payment.id);
            if (rpPayment.status !== 'captured') {
              throw new BusinessRuleError('Payment status is not captured', 'PAYMENT_NOT_CAPTURED');
            }

            await this.confirmFromWebhook(orderId, payment.id, mapRazorpayMethod(payment.method));
          }
          break;
        }
        case 'payment.failed': {
          if (payment?.order_id) await this.markFailed(payment.order_id);
          break;
        }
        default:
          logger.info({ event: event.event }, 'Unhandled Razorpay webhook event');
      }

      // Mark event as processed
      await supabase
        .from('payment_events')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('event_id', eventId);
    } catch (err: any) {
      // Mark event as failed
      await supabase
        .from('payment_events')
        .update({ status: 'failed', error_msg: err.message || 'Unknown error' })
        .eq('event_id', eventId);
      throw err;
    }
  }

  /**
   * Enriched payment list for gym owners and staff: joins real member names,
   * emails, phones, and plan titles so the dashboard never shows generic placeholders.
   */
  static async list(
    gymId: string,
    query: ListQuery,
    filters: { status?: string; memberId?: string } = {},
  ): Promise<PaginatedResult<PaymentDto>> {
    const result = await paymentRepository.list({
      gymId,
      page: query.page,
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      order: query.order,
      status: filters.status,
      memberId: filters.memberId,
    });

    const memberIds = Array.from(new Set(result.items.map((p) => p.member_id).filter(Boolean))) as string[];
    const subIds = Array.from(new Set(result.items.map((p) => p.subscription_id).filter(Boolean))) as string[];

    const [membersRes, subsRes] = await Promise.all([
      memberIds.length > 0
        ? supabase.from('members').select('id, full_name, email, phone').in('id', memberIds)
        : { data: [] },
      subIds.length > 0
        ? supabase.from('subscriptions').select('id, plan:plans(name)').in('id', subIds)
        : { data: [] },
    ]);

    const memberMap = new Map((membersRes.data || []).map((m: any) => [m.id, m]));
    const subMap = new Map((subsRes.data || []).map((s: any) => [s.id, s.plan?.name]));

    const items: PaymentDto[] = result.items.map((row) => {
      const dto = toPaymentDto(row);
      const m = row.member_id ? memberMap.get(row.member_id) : null;
      const planName = row.subscription_id ? subMap.get(row.subscription_id) : null;

      return {
        ...dto,
        memberName: m?.full_name || m?.email || 'Gym Customer',
        memberEmail: m?.email || null,
        memberPhone: m?.phone || null,
        planName: planName || 'Membership Plan',
      };
    });

    return { ...result, items };
  }

  static async getById(gymId: string, id: string): Promise<PaymentDto> {
    const row = await paymentRepository.findById(id, gymId);
    if (!row) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    return toPaymentDto(row);
  }

  /** Refund a successful payment and cancel its subscription. */
  static async refund(gymId: string, id: string): Promise<PaymentDto> {
    const payment = await paymentRepository.findById(id, gymId);
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    if (payment.status !== 'success') {
      throw new BusinessRuleError('Only successful payments can be refunded', 'NOT_REFUNDABLE');
    }

    if (payment.razorpay_payment_id) {
      await RazorpayService.refund(payment.razorpay_payment_id, Number(payment.amount));
    }

    const updated = await paymentRepository.update(id, { status: 'refunded' }, gymId);
    if (!updated) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');

    if (payment.subscription_id) {
      await SubscriptionService.cancel(gymId, payment.subscription_id).catch(() => undefined);
    }

    return toPaymentDto(updated);
  }

  /** Post-payment auto-join & activation lifecycle handler. */
  private static async handlePostPaymentAutoJoin(gymId: string, memberId: string): Promise<void> {
    try {
      const member = await MemberService.getById(gymId, memberId).catch(() => null);
      if (member) {
        // 1. Activate member status
        await supabase
          .from('members')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', memberId)
          .eq('gym_id', gymId);

        // 2. Link member's profile to gym if user profile is present
        if (member.profileId) {
          await supabase
            .from('profiles')
            .update({ gym_id: gymId })
            .eq('id', member.profileId);

          // 3. Mark any existing join request approved
          await supabase
            .from('gym_join_requests')
            .update({ status: 'approved', updated_at: new Date().toISOString() })
            .eq('profile_id', member.profileId)
            .eq('gym_id', gymId);
        }
      }
    } catch (err: any) {
      logger.error(err, 'Failed to complete post-payment auto-join');
    }
  }

  private static async resolveMemberId(
    user: UserContext,
    gymId: string,
    requestedMemberId?: string,
  ): Promise<string> {
    if (user.role === Role.CUSTOMER) {
      const member = await MemberService.resolveForProfile(gymId, user.id, {
        fullName: user.email,
        email: user.email,
      });
      return member.id;
    }

    if (!requestedMemberId) {
      throw new BadRequestError('memberId is required', 'MEMBER_ID_REQUIRED');
    }
    // Verifies the member exists in this gym (throws 404 otherwise).
    const member = await MemberService.getById(gymId, requestedMemberId);
    return member.id;
  }
}
