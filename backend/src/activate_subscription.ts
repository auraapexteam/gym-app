import { supabase } from './config/supabase';

async function activateLatest() {
  console.log("Activating latest subscription...");
  
  // Find the latest pending subscription
  const { data: subs, error: fetchErr } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchErr || !subs || subs.length === 0) {
    console.error("No pending subscription found:", fetchErr);
    return;
  }

  const latestSub = subs[0];
  console.log(`Found subscription: ${latestSub.id} for user ${latestSub.user_id}`);

  // Update status to active and set period dates
  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(now.getMonth() + 1);

  const { data: updatedSub, error: updateErr } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: nextMonth.toISOString(),
      updated_at: now.toISOString()
    })
    .eq('id', latestSub.id)
    .select()
    .single();

  if (updateErr) {
    console.error("Failed to update subscription:", updateErr);
    return;
  }

  // Insert a success payment record
  const { error: payErr } = await supabase
    .from('payments')
    .insert({
      subscription_id: latestSub.id,
      amount: 199.00,
      currency: 'INR',
      status: 'success',
      razorpay_payment_id: 'pay_simulated_' + Math.random().toString(36).substring(7),
      paid_at: now.toISOString()
    });

  if (payErr) {
    console.error("Failed to record payment:", payErr);
    return;
  }

  console.log("Subscription successfully activated and payment recorded!");
}

activateLatest();
