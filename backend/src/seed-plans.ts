import { supabase } from './config/supabase';
import { logger } from './config/logger';

async function seedPlans() {
  logger.info('Checking gyms and plans in Supabase...');

  const { data: gyms, error: gymErr } = await supabase.from('gyms').select('*');
  if (gymErr) {
    logger.error(gymErr, 'Error fetching gyms');
    return;
  }

  logger.info(`Found ${gyms?.length || 0} gyms.`);

  for (const gym of gyms || []) {
    const { data: existingPlans } = await supabase.from('plans').select('*').eq('gym_id', gym.id);
    logger.info(`Gym ${gym.name} (${gym.id}) has ${existingPlans?.length || 0} plans.`);

    if (!existingPlans || existingPlans.length === 0) {
      const livePlans = [
        {
          gym_id: gym.id,
          name: 'Starter Tier',
          description: 'Full access to gym floor, standard locker room, and 1 group fitness class per week.',
          price: 999,
          duration_days: 30,
          features: ['Full gym floor access', 'Standard locker inclusion', '1 group class / week', 'Digital QR pass check-in'],
          is_active: true,
        },
        {
          gym_id: gym.id,
          name: 'Standard Pro',
          description: 'Unlimited gym & group class access, sauna recovery lounge, and digital workout logs.',
          price: 2499,
          duration_days: 30,
          features: ['All Starter perks', 'Unlimited group classes & spin', 'Sauna & steam recovery access', 'Daily progress tracking logs'],
          is_active: true,
        },
        {
          gym_id: gym.id,
          name: 'Elite VIP',
          description: 'All-inclusive VIP membership with dedicated personal trainer sessions and customized nutrition plans.',
          price: 4999,
          duration_days: 30,
          features: ['All Standard perks', 'Personal trainer 4x / month', 'Personalized nutrition meal plan', 'Recovery lounge & priority slots'],
          is_active: true,
        },
      ];

      const { data: inserted, error: insertErr } = await supabase.from('plans').insert(livePlans).select();
      if (insertErr) {
        logger.error(insertErr, `Failed to insert plans for gym ${gym.name}`);
      } else {
        logger.info(`Inserted ${inserted?.length} real live plans for ${gym.name}!`);
      }
    }
  }

  logger.info('Live plans verification completed successfully.');
}

seedPlans().then(() => process.exit(0));
