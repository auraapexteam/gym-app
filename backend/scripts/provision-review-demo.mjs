import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

// Public project identifier, not a credential. Never provision review fixtures
// in the production project, even when a caller passes its admin credential.
const PRODUCTION_PROJECT_REF = 'jodthhltepjoepeaoano';

export function createReviewPlan(fixtureId = randomUUID()) {
  return Object.freeze({
    fixtureId,
    email: `app-review-${fixtureId}@example.invalid`,
    fullName: 'Synthetic App Reviewer',
    gymName: 'Synthetic Review Gym',
    gymSlug: `review-fixture-${fixtureId}`,
    gymStatus: 'pending',
    role: 'customer',
    memberStatus: 'inactive',
  });
}

/** Validate the explicit staging target before loading a client or contacting it. */
export function validateStagingConfiguration(environment, requestedProjectRef) {
  const projectRef = environment.DEMO_ALLOWED_PROJECT_REF;
  if (environment.DEMO_ENVIRONMENT !== 'staging') {
    throw new Error('DEMO_ENVIRONMENT must explicitly be staging.');
  }
  if (!projectRef || !/^[a-z0-9]{20}$/.test(projectRef) || projectRef !== requestedProjectRef) {
    throw new Error('--project-ref must match the explicit DEMO_ALLOWED_PROJECT_REF.');
  }
  if (projectRef === PRODUCTION_PROJECT_REF) {
    throw new Error('The production Supabase project is forbidden. Use a separate staging project.');
  }
  let url;
  try {
    url = new URL(environment.DEMO_SUPABASE_URL);
  } catch {
    throw new Error('DEMO_SUPABASE_URL must identify the explicit staging project.');
  }
  if (url.protocol !== 'https:' || url.hostname !== `${projectRef}.supabase.co`
      || url.port || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('DEMO_SUPABASE_URL must be the HTTPS origin for the allowlisted staging project.');
  }
  const serviceRoleKey = environment.DEMO_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error('DEMO_SUPABASE_SERVICE_ROLE_KEY is required for staging provisioning.');
  const password = environment.DEMO_REVIEW_PASSWORD;
  if (!password || password.length < 20 || !/[A-Z]/.test(password)
      || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw new Error('DEMO_REVIEW_PASSWORD must have at least 20 characters, upper/lowercase, a digit and a symbol.');
  }
  return { projectRef, url: url.origin, serviceRoleKey, password };
}

/** Add synthetic records only; failures clean up only IDs created by this run. */
export async function provisionReviewDemo(client, plan, password) {
  let gymId;
  let userId;
  let step = 'create pending gym';
  try {
    const gymResult = await client.from('gyms').insert({
      name: plan.gymName,
      slug: plan.gymSlug,
      status: 'pending',
      settings: { review_fixture: plan.fixtureId, environment: 'staging' },
    }).select('id').single();
    if (gymResult.error || !gymResult.data?.id) throw new Error('Gym creation failed');
    gymId = gymResult.data.id;

    step = 'create synthetic customer';
    // Admin createUser does not send a signup email. example.invalid cannot be
    // a real mailbox. The customer has no owner/staff/platform permissions.
    const authResult = await client.auth.admin.createUser({
      email: plan.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: plan.fullName, review_fixture: plan.fixtureId },
    });
    if (authResult.error || !authResult.data?.user?.id) throw new Error('Customer creation failed');
    userId = authResult.data.user.id;

    step = 'link new customer profile';
    const profileResult = await client.from('profiles').update({
      role: 'customer', status: 'active', gym_id: gymId, full_name: plan.fullName,
    }).eq('id', userId).select('id').single();
    if (profileResult.error || profileResult.data?.id !== userId) throw new Error('Profile linking failed');

    step = 'create synthetic inactive member';
    const memberResult = await client.from('members').insert({
      gym_id: gymId, profile_id: userId, full_name: plan.fullName,
      email: plan.email, status: 'inactive', notes: `Synthetic review fixture ${plan.fixtureId}`,
    });
    if (memberResult.error) throw new Error('Member creation failed');

    step = 'create synthetic gym link';
    const linkResult = await client.from('gym_join_requests').insert({
      gym_id: gymId, profile_id: userId, status: 'approved',
    });
    if (linkResult.error) throw new Error('Gym link creation failed');

    return { fixtureId: plan.fixtureId, gymId, userId, reviewEmail: plan.email };
  } catch {
    const cleanupFailures = [];
    if (gymId) {
      try {
        const { error } = await client.from('gyms').delete().eq('id', gymId);
        if (error) cleanupFailures.push('new gym');
      } catch { cleanupFailures.push('new gym'); }
    }
    if (userId) {
      try {
        const { error } = await client.auth.admin.deleteUser(userId);
        if (error) cleanupFailures.push('new customer');
      } catch { cleanupFailures.push('new customer'); }
    }
    const cleanup = cleanupFailures.length
      ? ` Manual staging cleanup needed for ${cleanupFailures.join(' and ')} (fixture ${plan.fixtureId}).`
      : ' Cleanup completed for returned new record IDs; inspect staging if a request outcome is unknown.';
    // Do not print provider error objects, credentials or passwords.
    throw new Error(`Review provisioning failed during: ${step}.${cleanup}`);
  }
}

export function parseArguments(argv) {
  let commit = false;
  let dryRun = false;
  let projectRef;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--commit') commit = true;
    else if (argv[i] === '--dry-run') dryRun = true;
    else if (argv[i] === '--project-ref' && argv[i + 1] && !argv[i + 1].startsWith('--')) projectRef = argv[++i];
    else throw new Error('Supported arguments: --dry-run OR --commit --project-ref <staging-ref>.');
  }
  if (commit && dryRun) throw new Error('--commit and --dry-run cannot be combined.');
  if (commit && !projectRef) throw new Error('--commit requires --project-ref <staging-ref>.');
  return { commit, projectRef };
}

export async function run(argv, environment, { createClient, output = console.log } = {}) {
  const options = parseArguments(argv);
  const plan = createReviewPlan();
  if (!options.commit) {
    output(JSON.stringify({
      mode: 'dry-run', plan,
      limitations: ['Separate staging project required; production is forbidden.',
        'Pending hides directory discovery; it is not a private tenant security boundary.',
        'No owner/admin roles, real emails, plans, payments or active memberships are created.'],
    }, null, 2));
    return;
  }
  const config = validateStagingConfiguration(environment, options.projectRef);
  const clientFactory = createClient ?? (await import('@supabase/supabase-js')).createClient;
  const client = clientFactory(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await provisionReviewDemo(client, plan, config.password);
  output(JSON.stringify({ mode: 'committed-to-staging', projectRef: config.projectRef, ...result,
    password: 'Use the privately supplied DEMO_REVIEW_PASSWORD; it is never printed.' }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(process.argv.slice(2), process.env).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
