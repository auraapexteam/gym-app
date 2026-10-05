import { paymentsApi } from './payments';
import type { PhysicalMembershipOrder } from './payments';
import { useAuthStore } from '@/store/auth.store';

interface CheckoutResult { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
type CheckoutOptions = {
  key: string; order_id: string; amount: number; currency: string; name: string; description: string;
  handler: (result: CheckoutResult) => void; modal: { ondismiss: () => void };
};
type CheckoutConstructor = new (options: CheckoutOptions) => { open: () => void; on: (event: string, callback: () => void) => void };
declare global { interface Window { Razorpay?: CheckoutConstructor } }
let scriptFlight: Promise<CheckoutConstructor> | null = null;

async function loadCheckout(): Promise<CheckoutConstructor> {
  if (window.Razorpay) return window.Razorpay;
  if (!scriptFlight) scriptFlight = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => window.Razorpay ? resolve(window.Razorpay) : reject(new Error('Checkout is unavailable. Please retry.'));
    script.onerror = () => { scriptFlight = null; script.remove(); reject(new Error('Checkout could not load. Please check your connection.')); };
    document.head.appendChild(script);
  });
  return scriptFlight;
}

export async function payForPhysicalMembership(planId: string, open = openCheckout): Promise<void> {
  const generation = useAuthStore.getState().accountGeneration;
  const response = await paymentsApi.createOrder(planId);
  if (!response.data.success) throw new Error('The payment order was not created.');
  const order = response.data.data;
  if (generation !== useAuthStore.getState().accountGeneration) throw new Error('Account changed. Please sign in again.');
  const result = await open(order);
  if (generation !== useAuthStore.getState().accountGeneration) throw new Error('Account changed. Check payment status after signing in.');
  if (result.razorpay_order_id !== order.orderId) throw new Error('Payment order did not match. Contact support.');
  const verified = await paymentsApi.verifyOrder({ orderId: order.orderId,
    paymentId: result.razorpay_payment_id, signature: result.razorpay_signature });
  if (!verified.data.success) throw new Error('Payment confirmation is pending. Check your membership before paying again.');
}

async function openCheckout(order: PhysicalMembershipOrder): Promise<CheckoutResult> {
  const Checkout = await loadCheckout();
  return new Promise((resolve, reject) => {
    const checkout = new Checkout({ key: order.razorpayKeyId, order_id: order.orderId,
      amount: order.amountInPaise, currency: order.currency, name: 'Aura Apex',
      description: `Physical gym membership: ${order.planName}`, handler: resolve,
      modal: { ondismiss: () => reject(new Error('Checkout closed. No membership activation was confirmed.')) } });
    checkout.on('payment.failed', () => reject(new Error('Payment failed. Check your payment status before trying again.')));
    checkout.open();
  });
}
