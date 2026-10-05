import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { AuthRetryableFetchError } from '@supabase/supabase-js';
import { createApp } from '@/app';
import { createAuthClient, supabase, supabaseAnon } from '@/config/supabase';
import { profileRepository } from '@/modules/auth/auth.repository';
import { AuthService } from '@/modules/auth/auth.service';
import { mockTable, resetMocks, setupAuthUser } from './utils/test-helpers';
import { Role } from '@/shared/rbac';

const app = createApp();
const profileId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba1';
const privatePath = `personal/${profileId}/progress-photo/nonce-photo.jpg`;
const bucket = {
  id: 'gym-personal', public: false, file_size_limit: 5_242_880,
  allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp'],
};

describe('Compliance security regression boundaries', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetMocks();
    setupAuthUser(Role.CUSTOMER, null, profileId);
    vi.mocked(supabase.storage.getBucket).mockResolvedValue({ data: bucket as any, error: null });
  });

  it.each([
    new AuthRetryableFetchError('private network diagnostics', 0),
    { status: 429, message: 'private provider throttle diagnostics' },
    { status: 503, message: 'private provider outage diagnostics' },
  ])('keeps provider outages distinct from an expired session', async (providerError) => {
    vi.mocked(supabaseAnon.auth.refreshSession).mockResolvedValueOnce({
      data: { user: null, session: null }, error: providerError as any,
    });
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: 'synthetic-refresh' });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AUTH_PROVIDER_UNAVAILABLE');
    expect(JSON.stringify(res.body)).not.toContain('private provider');
    expect(JSON.stringify(res.body)).not.toContain('private network');
    expect(res.headers['cache-control']).toBe('private, no-store');
  });

  it('distinguishes a rejected refresh token from a retryable outage', async () => {
    vi.mocked(supabaseAnon.auth.refreshSession).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { status: 400, code: 'refresh_token_already_used', message: 'private token diagnostics' } as any,
    });
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: 'synthetic-invalid-refresh' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('SESSION_EXPIRED');
    expect(JSON.stringify(res.body)).not.toContain('private token');
  });

  it('isolates every public authentication exchange in a request-scoped client', async () => {
    const session = { access_token: 'synthetic-access', refresh_token: 'synthetic-refresh', expires_at: 1234567890 } as any;
    const user = { id: profileId, email: 'synthetic-auth@example.invalid' } as any;
    vi.mocked(supabaseAnon.auth.signInWithPassword).mockResolvedValueOnce({ data: { user, session }, error: null });
    vi.mocked(supabaseAnon.auth.verifyOtp).mockResolvedValueOnce({ data: { user, session }, error: null });
    await AuthService.login({ email: 'test@example.com', password: 'SyntheticPassword1!' });
    await AuthService.forgotPassword('synthetic-auth@example.invalid');
    await AuthService.sendPhoneOtp('+910000000000');
    await AuthService.verifyPhoneOtp('+910000000000', '123456');
    expect(createAuthClient).toHaveBeenCalledTimes(4);
    expect(supabaseAnon.auth.signInWithPassword).toHaveBeenCalledTimes(1);
    expect(supabaseAnon.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
    expect(supabaseAnon.auth.signInWithOtp).toHaveBeenCalledTimes(1);
    expect(supabaseAnon.auth.verifyOtp).toHaveBeenCalledTimes(1);
  });

  it('suppresses a legacy public avatar without attempting to sign it', async () => {
    mockTable('profiles', { id: profileId, role: Role.CUSTOMER, status: 'active', avatar_url: 'https://example.invalid/legacy-public-avatar.jpg' });
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${profileId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ avatarUrl: null, avatarPath: null, avatarUnavailable: true });
    expect(supabase.storage.getBucket).not.toHaveBeenCalled();
    expect(res.headers['cache-control']).toBe('private, no-store');
  });

  it('rejects a new arbitrary public avatar URL before writing a profile', async () => {
    const write = vi.spyOn(profileRepository, 'update');
    const res = await request(app).patch('/api/v1/auth/me').set('Authorization', `Bearer ${profileId}`)
      .send({ avatarUrl: 'https://example.invalid/arbitrary-avatar.jpg' });
    expect(res.status).toBe(400);
    expect(write).not.toHaveBeenCalled();
  });

  it.each([
    { file_size_limit: null },
    { file_size_limit: 10_485_760 },
    { allowed_mime_types: null },
    { allowed_mime_types: ['image/*'] },
    { allowed_mime_types: ['image/jpeg', 'text/html'] },
  ])('refuses an upload when bucket limits are unsafe: %j', async (unsafe) => {
    vi.mocked(supabase.storage.getBucket).mockResolvedValueOnce({ data: { ...bucket, ...unsafe } as any, error: null });
    const res = await request(app).post('/api/v1/uploads/signed-url').set('Authorization', `Bearer ${profileId}`)
      .send({ purpose: 'progress-photo', fileName: 'photo.jpg', mimeType: 'image/jpeg', size: 1024 });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('PRIVATE_STORAGE_UNAVAILABLE');
    expect(supabase.storage.from).not.toHaveBeenCalled();
  });

  it('does not allow private upload credentials to be cached', async () => {
    const res = await request(app).post('/api/v1/uploads/signed-url').set('Authorization', `Bearer ${profileId}`)
      .send({ purpose: 'avatar', fileName: 'photo.jpg', mimeType: 'image/jpeg', size: 1024 });
    expect(res.status).toBe(201);
    expect(res.headers['cache-control']).toBe('private, no-store');
    expect(res.body.data.publicUrl).toBeUndefined();
  });

  it('preserves other progress records when private image signing is unavailable', async () => {
    mockTable('progress_logs', [{ id: 'weight', profile_id: profileId, weight: 70, log_date: '2026-01-01' }]);
    mockTable('notes_logs', [{ id: 'note', profile_id: profileId, note: 'Synthetic note', log_date: '2026-01-01' }]);
    mockTable('progress_images', [{ id: 'photo', profile_id: profileId, image_url: privatePath, log_date: '2026-01-01' }]);
    vi.mocked(supabase.storage.from).mockReturnValueOnce({
      createSignedUrl: vi.fn(async () => ({ data: null, error: { message: 'private storage diagnostics' } })),
    } as any);
    const res = await request(app).get('/api/v1/progress/month?year=2026&month=1')
      .set('Authorization', `Bearer ${profileId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.weightLogs).toEqual([expect.objectContaining({ id: 'weight', weight: 70 })]);
    expect(res.body.data.notesLogs).toEqual([expect.objectContaining({ id: 'note', note: 'Synthetic note' })]);
    expect(res.body.data.imageLogs).toEqual([expect.objectContaining({ id: 'photo', image_url: null, unavailable: true })]);
    expect(res.headers['cache-control']).toBe('private, no-store');
    expect(JSON.stringify(res.body)).not.toContain('private storage diagnostics');
  });

  it('rejects optional health collection without explicit consent', async () => {
    const write = vi.spyOn(profileRepository, 'update');
    const res = await request(app).patch('/api/v1/auth/me').set('Authorization', `Bearer ${profileId}`)
      .send({ weightKg: 70, healthConditions: ['Synthetic condition'] });
    expect(res.status).toBe(400);
    expect(write).not.toHaveBeenCalled();
  });

  it('withdraws optional health consent and clears the associated profile fields', async () => {
    const write = vi.spyOn(profileRepository, 'update').mockResolvedValueOnce({ id: profileId, role: Role.CUSTOMER, status: 'active' } as any);
    const res = await request(app).patch('/api/v1/auth/me').set('Authorization', `Bearer ${profileId}`)
      .send({ healthDataConsent: false });
    expect(res.status).toBe(200);
    expect(write).toHaveBeenCalledWith(profileId, expect.objectContaining({
      weight_kg: null, height_cm: null, fitness_level: null, fitness_goal: null,
      training_frequency: null, has_health_condition: null, dietary_preference: null,
      health_conditions: [], health_data_consent_at: null, health_data_notice_version: null,
    }));
  });
});
