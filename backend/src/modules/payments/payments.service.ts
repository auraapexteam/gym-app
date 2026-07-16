import { env } from '@/config/env';
import { logger } from '@/config/logger';
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
    const payment = event.payload?.payment?.entity;
    switch (event.event) {
      case 'order.paid':
      case 'payment.captured': {
        const orderId = payment?.order_id ?? event.payload?.order?.entity?.id;
        if (orderId && payment?.id) {
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
  }

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
    return { ...result, items: result.items.map(toPaymentDto) };
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
