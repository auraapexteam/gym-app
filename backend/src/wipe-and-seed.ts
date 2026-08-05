import { supabase } from './config/supabase';
import { AuthService } from './modules/auth/auth.service';
import { Role } from './shared/rbac/roles';
import { logger } from './config/logger';

async function wipeAndSeed() {
  logger.info('Starting complete database wipe...');

  try {
    // 1. Truncate all business tables
    const tables = [
      'audit_logs',
      'notifications',
      'gallery_items',
      'equipment',
      'trainers',
      'gym_staff',
      'attendance_logs',
      'qr_codes',
      'payments',
      'subscriptions',
      'members',
      'plans',
      'gyms',
      'profiles',
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        logger.warn({ table, error: error.message }, 'Truncate step warning');
      }
    }
    logger.info('All database tables cleared.');

    // 2. Delete all Supabase auth users
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (!listError && usersData?.users) {
      for (const u of usersData.users) {
        await supabase.auth.admin.deleteUser(u.id);
      }
      logger.info(`Deleted ${usersData.users.length} Auth users.`);
    }

    // 3. Re-seed fresh clean accounts
    logger.info('Seeding clean accounts...');
    const password = 'Password123!';

    // Super Admin
    const adminEmail = 'admin@aura-apex.com';
    await AuthService.createManagedUser({
      email: adminEmail,
      password,
      fullName: 'Super Admin User',
      role: Role.SUPER_ADMIN,
      gymId: null as any,
    });
    logger.info(`Super Admin created: ${adminEmail} (password: ${password})`);

    // Gym & Owner
    const ownerEmail = 'owner@aura-apex.com';
    const { data: gymData, error: gymError } = await supabase
      .from('gyms')
      .insert({
        name: 'Apex Fitness Center',
        slug: 'apex-fitness',
        status: 'active',
      })
      .select()
      .single();

    if (gymError) throw gymError;

    const ownerProfile = await AuthService.createManagedUser({
      email: ownerEmail,
      password,
      fullName: 'Gym Owner Jack',
      role: Role.OWNER,
      gymId: gymData.id,
    });

    await supabase.from('gyms').update({ owner_id: ownerProfile.id }).eq('id', gymData.id);
    logger.info(`Gym 'Apex Fitness Center' and Owner '${ownerEmail}' created!`);

    // Staff
    const staffEmail = 'staff@aura-apex.com';
    const staffProfile = await AuthService.createManagedUser({
      email: staffEmail,
      password,
      fullName: 'Staff Member Sarah',
      role: Role.STAFF,
      gymId: gymData.id,
    });

    await supabase.from('gym_staff').insert({
      gym_id: gymData.id,
      profile_id: staffProfile.id,
      role: Role.STAFF,
      permissions: ['member.read', 'member.create', 'attendance.read', 'attendance.create'],
      status: 'active',
    });

    // Trainer
    const trainerEmail = 'trainer@aura-apex.com';
    const trainerProfile = await AuthService.createManagedUser({
      email: trainerEmail,
      password,
      fullName: 'Coach Arnold',
      role: Role.TRAINER,
      gymId: gymData.id,
    });

    await supabase.from('trainers').insert({
      gym_id: gymData.id,
      profile_id: trainerProfile.id,
      full_name: 'Coach Arnold',
      specialization: 'Powerlifting, Strength',
      status: 'active',
    });

    logger.info('Seeding completed successfully!');
  } catch (err: any) {
    logger.error(err, 'Error during wipe & seed:');
  }
}

wipeAndSeed().then(() => process.exit(0));
