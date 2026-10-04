import { describe, expect, it, vi } from 'vitest';
// The operator script is independent of server configuration and its .env.
// @ts-expect-error Standalone JavaScript operator script has no declaration file.
import { createReviewPlan, provisionReviewDemo, run, validateStagingConfiguration } from '../scripts/provision-review-demo.mjs';

const stagingRef = 'abcdefghijklmnopqrst';
const configuration = {
  DEMO_ENVIRONMENT: 'staging', DEMO_ALLOWED_PROJECT_REF: stagingRef,
  DEMO_SUPABASE_URL: `https://${stagingRef}.supabase.co`,
  DEMO_SUPABASE_SERVICE_ROLE_KEY: 'dummy-staging-key',
  DEMO_REVIEW_PASSWORD: 'Synthetic-review-password-123!',
};

describe('Review demo provisioning safeguards', () => {
  it('defaults to dry-run without loading a client or needing credentials', async () => {
    const createClient = vi.fn();
    const output = vi.fn();
    await run([], {}, { createClient, output });
    expect(createClient).not.toHaveBeenCalled();
    expect(JSON.parse(output.mock.calls[0][0])).toMatchObject({ mode: 'dry-run', plan: { role: 'customer', gymStatus: 'pending' } });
  });

  it('rejects the known production project before contacting any client', async () => {
    const productionRef = 'jodthhltepjoepeaoano';
    const createClient = vi.fn();
    await expect(run(['--commit', '--project-ref', productionRef], {
      ...configuration, DEMO_ALLOWED_PROJECT_REF: productionRef,
      DEMO_SUPABASE_URL: `https://${productionRef}.supabase.co`,
    }, { createClient })).rejects.toThrow('production Supabase project is forbidden');
    expect(createClient).not.toHaveBeenCalled();
  });

  it.each([
    { ...configuration, DEMO_ENVIRONMENT: 'production' },
    { ...configuration, DEMO_SUPABASE_URL: 'https://other-project.supabase.co' },
    { ...configuration, DEMO_REVIEW_PASSWORD: 'weak' },
  ])('rejects an unsafe or mismatched staging configuration', (environment) => {
    expect(() => validateStagingConfiguration(environment, stagingRef)).toThrow();
  });

  it('requires an explicit commit flag and matching project reference', async () => {
    await expect(run(['--commit'], configuration)).rejects.toThrow('--commit requires');
    expect(() => validateStagingConfiguration(configuration, 'different-project')).toThrow('must match');
  });

  it('creates only synthetic customer records and a pending gym on success', async () => {
    const insertGym = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: 'new-gym-id' }, error: null }),
    }) });
    const insertMember = vi.fn().mockResolvedValue({ error: null });
    const insertLink = vi.fn().mockResolvedValue({ error: null });
    const updateProfile = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'new-user-id' }, error: null }) }),
    }) });
    const from = vi.fn((table: string) => ({
      gyms: { insert: insertGym }, profiles: { update: updateProfile },
      members: { insert: insertMember }, gym_join_requests: { insert: insertLink },
    }[table]));
    const createUser = vi.fn().mockResolvedValue({ data: { user: { id: 'new-user-id' } }, error: null });
    const deleteUser = vi.fn();
    const plan = createReviewPlan('synthetic-fixture');

    await expect(provisionReviewDemo({ from, auth: { admin: { createUser, deleteUser } } }, plan, configuration.DEMO_REVIEW_PASSWORD))
      .resolves.toEqual({ fixtureId: 'synthetic-fixture', gymId: 'new-gym-id', userId: 'new-user-id', reviewEmail: plan.email });
    expect(from.mock.calls.map(([table]) => table)).toEqual(['gyms', 'profiles', 'members', 'gym_join_requests']);
    expect(insertGym).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending', slug: 'review-fixture-synthetic-fixture' }));
    expect(updateProfile).toHaveBeenCalledWith(expect.objectContaining({ role: 'customer', gym_id: 'new-gym-id' }));
    expect(insertMember).toHaveBeenCalledWith(expect.objectContaining({ status: 'inactive', profile_id: 'new-user-id' }));
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ email: 'app-review-synthetic-fixture@example.invalid', email_confirm: true }));
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('rolls back only the synthetic IDs created by this run on a linking failure', async () => {
    const removeGym = vi.fn().mockResolvedValue({ error: null });
    const updateProfile = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ error: { message: 'failure' } }) }) }),
    });
    const client = {
      from: vi.fn((table: string) => table === 'gyms' ? {
        insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'new-gym-id' }, error: null }) }) }),
        delete: vi.fn().mockReturnValue({ eq: removeGym }),
      } : { update: updateProfile }),
      auth: { admin: {
        createUser: vi.fn().mockResolvedValue({ data: { user: { id: 'new-user-id' } }, error: null }),
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
      } },
    };
    await expect(provisionReviewDemo(client, createReviewPlan('synthetic-fixture'), configuration.DEMO_REVIEW_PASSWORD)).rejects.toThrow('link new customer profile');
    expect(removeGym).toHaveBeenCalledWith('id', 'new-gym-id');
    expect(client.auth.admin.deleteUser).toHaveBeenCalledWith('new-user-id');
    expect(updateProfile).toHaveBeenCalledWith(expect.objectContaining({ role: 'customer', gym_id: 'new-gym-id' }));
    expect(client.auth.admin.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: 'app-review-synthetic-fixture@example.invalid', email_confirm: true }));
  });
});
