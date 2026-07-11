import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { SubscriptionService } from '../services/subscription';
import { RazorpayService } from '../services/razorpay';

export class SubscriptionController {
  /**
   * Create a new subscription checkout session
   */
  static async createSubscription(req: AuthenticatedRequest, res: Response) {
    try {
      const { planId } = req.body;
      const user = req.user;

      if (!planId) {
        return res.status(400).json({ success: false, message: 'planId is required' });
      }

      // 1. Fetch the plan details from Supabase
      const plan = await SubscriptionService.getPlanById(planId);

      // 2. Dynamically create a plan in Razorpay for this checkout
      // In a real-world scenario, you might pre-create these plans and store their Razorpay IDs.
      // Doing it dynamically here makes it seamless to test.
      const razorpayPlanId = await RazorpayService.createRazorpayPlan(
        plan.name,
        plan.price,
        plan.billing_interval,
        plan.description || ''
      );

      // 3. Create the subscription on Razorpay
      const razorpaySub = await RazorpayService.createSubscription(razorpayPlanId, user.email);

      // 4. Save the subscription in Supabase with 'pending' status
      const localSub = await SubscriptionService.createSubscription(user.id, plan.id, razorpaySub.id);

      return res.status(201).json({
        success: true,
        data: {
          subscriptionId: localSub.id,
          razorpaySubscriptionId: razorpaySub.id,
          amount: plan.price,
          currency: 'INR',
          planName: plan.name,
        },
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create subscription',
      });
    }
  }

  /**
   * Fetch current subscription details of authenticated user
   */
  static async getCurrentSubscription(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      const subscription = await SubscriptionService.getSubscriptionByUserId(user.id);

      return res.status(200).json({
        success: true,
        data: subscription,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch subscription details',
      });
    }
  }
}
