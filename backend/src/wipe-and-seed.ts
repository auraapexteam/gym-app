import { supabase } from './config/supabase';
import { AuthService } from './modules/auth/auth.service';
import { Role } from './shared/rbac/roles';
import { logger } from './config/logger';

async function wipeAndSeedAdminOnly() {
  logger.info('Starting complete database wipe (ONLY Super Admin will be created)...');

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

    // 3. Seed ONLY Super Admin
    logger.info('Seeding ONLY Super Admin account...');
    const password = 'Password123!';
    const adminEmail = 'admin@aura-apex.com';

    await AuthService.createManagedUser({
      email: adminEmail,
      password,
      fullName: 'Super Admin User',
      role: Role.SUPER_ADMIN,
      gymId: null as any,
    });

    logger.info(`Super Admin created successfully!`);
    logger.info(`Email: ${adminEmail}`);
    logger.info(`Password: ${password}`);
    logger.info('Database is now completely fresh with ONLY 1 Super Admin account!');
  } catch (err: any) {
    logger.error(err, 'Error during wipe & seed admin only:');
  }
}

wipeAndSeedAdminOnly().then(() => process.exit(0));
