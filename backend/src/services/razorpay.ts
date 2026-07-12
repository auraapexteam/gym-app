import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error('Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in environment variables.');
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export class RazorpayService {
  /**
   * Dynamically creates a plan in Razorpay
   */
  static async createRazorpayPlan(name: string, price: number, interval: 'month' | 'year', description: string) {
    try {
      const plan = await razorpay.plans.create({
        period: interval === 'month' ? 'monthly' : 'yearly',
        interval: 1,
        item: {
          name,
          amount: Math.round(price * 100), // amount in paise (e.g. 199.00 -> 19900)
          currency: 'INR',
          description,
        },
      });
      return plan.id;
    } catch (error: any) {
      logger.error(error, 'Error creating Razorpay plan');
      throw new Error(`Razorpay plan creation failed: ${error.message}`);
    }
  }

  /**
   * Creates a subscription in Razorpay
   */
  static async createSubscription(razorpayPlanId: string, customerEmail: string) {
    try {
      const subscription = await razorpay.subscriptions.create({
        plan_id: razorpayPlanId,
        total_count: 12, // Number of billing cycles (e.g., 12 months)
        quantity: 1,
        customer_notify: 1, // Razorpay notifies customer via email/SMS
        addons: [],
        notes: {
          customer_email: customerEmail,
        },
      });
      return subscription;
    } catch (error: any) {
      logger.error(error, 'Error creating Razorpay subscription');
      throw new Error(`Razorpay subscription creation failed: ${error.message}`);
    }
  }
}
