import { PaymentRow, PaymentDto } from '@/modules/payments/payments.types';

export const toPaymentDto = (row: PaymentRow): PaymentDto => ({
  id: row.id,
  gymId: row.gym_id,
  subscriptionId: row.subscription_id,
  memberId: row.member_id,
  amount: Number(row.amount),
  currency: row.currency,
  status: row.status,
  method: row.method,
  razorpayOrderId: row.razorpay_order_id,
  razorpayPaymentId: row.razorpay_payment_id,
  paidAt: row.paid_at,
  createdAt: row.created_at,
});
