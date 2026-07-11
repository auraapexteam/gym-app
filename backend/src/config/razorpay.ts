import Razorpay from 'razorpay';
import { env, isRazorpayConfigured } from '@/config/env';
import { logger } from '@/config/logger';

/**
 * Lazily-initialized Razorpay client.
 *
 * Payments are an optional capability: the server boots fine without Razorpay
 * credentials, but payment endpoints will fail fast with a clear error until
 * the keys are configured. This keeps local/dev environments unblocked while
 * still surfacing misconfiguration loudly at call time.
 */
let client: Razorpay | null = null;

if (isRazorpayConfigured) {
  client = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID as string,
    key_secret: env.RAZORPAY_KEY_SECRET as string,
  });
  logger.info('Razorpay client initialized');
} else {
  logger.warn('Razorpay credentials not set — payment features are disabled');
}

/**
 * Returns the initialized Razorpay client, or throws if payments are not
 * configured. Callers (the payment service) translate this into a 503.
 */
export function getRazorpayClient(): Razorpay {
  if (!client) {
    throw new Error('Razorpay is not configured');
  }
  return client;
}

export { isRazorpayConfigured };
