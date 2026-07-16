export const DEFAULT_CURRENCY = 'INR';

export type NormalizedPaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet' | 'cash' | 'other';

/** Map a Razorpay payment method string to our normalized enum. */
export function mapRazorpayMethod(method?: string | null): NormalizedPaymentMethod {
  switch (method) {
    case 'card':
    case 'emi':
      return 'card';
    case 'upi':
      return 'upi';
    case 'netbanking':
      return 'netbanking';
    case 'wallet':
      return 'wallet';
    default:
      return 'other';
  }
}
