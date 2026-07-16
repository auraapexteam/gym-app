export type PaymentStatus = 'created' | 'pending' | 'success' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet' | 'cash' | 'other';

export interface PaymentRow {
  id: string;
  gym_id: string;
  subscription_id: string | null;
  member_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentDto {
  id: string;
  gymId: string;
  subscriptionId: string | null;
  memberId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  paidAt: string | null;
  createdAt: string;
}

/** Checkout parameters returned to the client to open Razorpay. */
export interface CheckoutOrderDto {
  orderId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  razorpayKeyId: string;
  subscriptionId: string;
  paymentId: string;
  planName: string;
}

/** Minimal order context used to confirm a payment. */
export interface OrderContext {
  paymentId: string;
  subscriptionId: string | null;
  gymId: string;
  memberId: string | null;
  status: PaymentStatus;
  durationDays: number;
}

export interface CreateOrderInput {
  planId: string;
  memberId?: string;
}

export interface VerifyPaymentInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

/** Minimal shape of the Razorpay webhook payloads we consume. */
export interface RazorpayWebhookEvent {
  event: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; method?: string } };
    order?: { entity?: { id?: string } };
  };
}
