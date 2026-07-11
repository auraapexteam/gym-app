import { supabase } from './config/supabase';

async function checkDb() {
  console.log("Checking database...");
  
  const { data: plans, error: planErr } = await supabase.from('plans').select('*');
  console.log("\n--- PLANS ---");
  console.log(plans || planErr);

  const { data: subs, error: subErr } = await supabase.from('subscriptions').select('*');
  console.log("\n--- SUBSCRIPTIONS ---");
  console.log(subs || subErr);

  const { data: payments, error: payErr } = await supabase.from('payments').select('*');
  console.log("\n--- PAYMENTS ---");
  console.log(payments || payErr);
}

checkDb();
