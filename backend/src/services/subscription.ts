import { supabase } from '../config/supabase';

export class SubscriptionService {
  /**
   * Fetch all plans
   */
  static async getPlans() {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch plans: ${error.message}`);
    }
    return data;
  }

  /**
   * Fetch a plan by ID
   */
  static async getPlanById(planId: string) {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error || !data) {
      throw new Error(`Plan not found: ${error?.message || 'Invalid ID'}`);
    }
    return data;
  }

  /**
   * Create a new subscription record
   */
  static async createSubscription(userId: string, planId: string, razorpaySubscriptionId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        razorpay_subscription_id: razorpaySubscriptionId,
        status: 'pending', // Pending payment checkout confirmation
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save subscription: ${error.message}`);
    }
    return data;
  }

  /**
   * Fetch user's active/current subscription
   */
  static async getSubscriptionByUserId(userId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Failed to fetch user subscription: ${error.message}`);
    }
    return data && data.length > 0 ? data[0] : null;
  }

  /**
   * Update plan with its generated Razorpay plan ID
   */
  static async updatePlanRazorpayId(planId: string, razorpayPlanId: string) {
    const { data, error } = await supabase
      .from('plans')
      .update({ razorpay_plan_id: razorpayPlanId })
      .eq('id', planId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update plan Razorpay ID: ${error.message}`);
    }
    return data;
  }

  /**
   * Update subscription status and period by Razorpay Subscription ID
   */
  static async updateSubscriptionStatus(
    razorpaySubscriptionId: string,
    status: string,
    periodStart?: Date,
    periodEnd?: Date
  ) {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (periodStart) updateData.current_period_start = periodStart.toISOString();
    if (periodEnd) updateData.current_period_end = periodEnd.toISOString();

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('razorpay_subscription_id', razorpaySubscriptionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update subscription status: ${error.message}`);
    }
    return data;
  }

  /**
   * Record a payment associated with a subscription
   */
  static async recordPayment(
    subscriptionId: string,
    amount: number,
    status: string,
    razorpayPaymentId: string,
    paidAt: Date
  ) {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        subscription_id: subscriptionId,
        amount,
        status,
        razorpay_payment_id: razorpayPaymentId,
        paid_at: paidAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record payment: ${error.message}`);
    }
    return data;
  }
}
