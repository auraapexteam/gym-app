import { supabase } from './config/supabase';
import { AuthService } from './modules/auth/auth.service';
import { Role } from './shared/rbac/roles';
import { logger } from './config/logger';

async function seed() {
  logger.info('Starting database seeding...');

  try {
    const password = 'Password123!';
    
    // 1. Fetch existing users to avoid duplicates
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    
    // 2. Create Super Admin User
    const adminEmail = 'admin@aura-apex.com';
    const existingAdmin = usersData.users.find(u => u.email === adminEmail);
    
    if (existingAdmin) {
      logger.info('Super Admin account already exists.');
    } else {
      await AuthService.createManagedUser({
        email: adminEmail,
        password,
        fullName: 'Super Admin User',
        role: Role.SUPER_ADMIN,
        gymId: null as any, // Platform admins do not belong to a single gym
      });
      logger.info(`Super Admin created successfully: ${adminEmail}`);
    }

    // 3. Create Gym & Owner
    const ownerEmail = 'owner@aura-apex.com';
    const existingOwner = usersData.users.find(u => u.email === ownerEmail);
    
    if (existingOwner) {
      logger.info('Owner account already exists.');
    } else {
      // Create a gym first
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
      logger.info(`Gym 'Apex Fitness Center' and Owner '${ownerEmail}' created successfully!`);

      // 4. Create a default Staff Member under the gym
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
      logger.info(`Staff member '${staffEmail}' onboarded successfully.`);

      // 5. Create a default Trainer under the gym
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
      logger.info(`Trainer '${trainerEmail}' onboarded successfully.`);
    }

    logger.info('Seeding completed successfully!');
  } catch (err: any) {
    logger.error(err, 'Error during seeding:');
  }
}


seed().then(() => process.exit(0));
