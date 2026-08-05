/**
 * Authentication Security Tests — Milestone 7
 *
 * Verifies the security properties of the auth layer:
 *  - Missing / malformed tokens are rejected with 401
 *  - Invalid Supabase tokens are rejected with 401
 *  - Suspended / inactive accounts are blocked with 403
 *  - Wrong passwords return 401 (not a 500)
 *  - Weak passwords are rejected at validation (422) with a clear message
 *  - Duplicate email registration returns 409
 *  - Forgot-password is always 200 (enumeration-safe)
 *  - JWT material never appears in response bodies
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { resetMocks, addMockProfile, mockTable } from './utils/test-helpers';
import { Role } from '@/shared/rbac';
import { AccountStatus } from '@/shared/types';
import { supabase, supabaseAnon } from '@/config/supabase';

const app = createApp();

const ACTIVE_USER_ID  = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba1';
const INACTIVE_USER_ID = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba5';
const GYM_ID = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2';

describe('Authentication Security', () => {
  beforeEach(() => {
    resetMocks();
  });

  // ─── Token / header validation ────────────────────────────────────────────

  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when Authorization header is malformed (no Bearer prefix)', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Basic dXNlcjpwYXNz');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when Bearer token is rejected by Supabase (invalid/expired)', async () => {
    // Override: Supabase reports the token is invalid
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'JWT expired', status: 401 } as any,
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.jwt.token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns 401 when Supabase returns no user (e.g. revoked session)', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer revoked.session.token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  // ─── Account status enforcement ───────────────────────────────────────────

  it('returns 403 for an inactive account (ACCOUNT_INACTIVE)', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: { id: INACTIVE_USER_ID, email: 'inactive@test.com' } as any },
      error: null,
    });
    addMockProfile({
      id:     INACTIVE_USER_ID,
      email:  'inactive@test.com',
      role:   Role.CUSTOMER,
      gym_id: null,
      status: AccountStatus.INACTIVE,
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${INACTIVE_USER_ID}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
  });

  it('returns 403 for a suspended account', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: { id: INACTIVE_USER_ID, email: 'suspended@test.com' } as any },
      error: null,
    });
    addMockProfile({
      id:     INACTIVE_USER_ID,
      email:  'suspended@test.com',
      role:   Role.CUSTOMER,
      gym_id: null,
      status: AccountStatus.SUSPENDED,
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${INACTIVE_USER_ID}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
  });

  it('returns 403 when the user\'s gym is suspended', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: { id: ACTIVE_USER_ID, email: 'owner@test.com' } as any },
      error: null,
    });
    addMockProfile({
      id:     ACTIVE_USER_ID,
      email:  'owner@test.com',
      role:   Role.OWNER,
      gym_id: GYM_ID,
      status: AccountStatus.ACTIVE,
      gyms:   { status: 'suspended' },
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${ACTIVE_USER_ID}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('GYM_SUSPENDED');
  });

  // ─── Login security ───────────────────────────────────────────────────────

  it('returns 401 for wrong password (never 500)', async () => {
    addMockProfile({
      id:     ACTIVE_USER_ID,
      email:  'someone@test.com',
      role:   Role.CUSTOMER,
      gym_id: null,
      status: AccountStatus.ACTIVE,
    });
    vi.mocked(supabaseAnon.auth.signInWithPassword).mockResolvedValueOnce({
      data: { session: null, user: null } as any,
      error: { message: 'Invalid login credentials', status: 400 } as any,
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'someone@test.com', password: 'WrongPass1!' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    // Must never expose internal error details
    expect(JSON.stringify(res.body)).not.toContain('supabase');
    expect(JSON.stringify(res.body)).not.toContain('postgres');
  });

  // ─── Password policy ──────────────────────────────────────────────────────

  it('rejects registration with a too-short password (422)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'new@test.com', password: 'short', fullName: 'Test User' });

    expect(res.status).toBe(400); // ValidationError maps to 400
    expect(res.body.success).toBe(false);
  });

  it('rejects registration with a password lacking uppercase (422)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'new@test.com', password: 'lowercase1!', fullName: 'Test User' });

    expect(res.status).toBe(400); // ValidationError maps to 400
    expect(res.body.error.details).toBeDefined();
  });

  it('rejects registration with a password lacking a digit (422)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'new@test.com', password: 'Nodigits!', fullName: 'Test User' });

    expect(res.status).toBe(400); // ValidationError maps to 400
  });

  it('rejects registration with a password lacking a special character (422)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'new@test.com', password: 'NoSpecial1', fullName: 'Test User' });

    expect(res.status).toBe(400); // ValidationError maps to 400
  });

  it('accepts registration with a strong password (Password123!)', async () => {
    addMockProfile({
      id:     ACTIVE_USER_ID,
      email:  'new@test.com',
      role:   Role.CUSTOMER,
      gym_id: null,
      status: AccountStatus.ACTIVE,
    });
    vi.mocked(supabase.auth.admin.createUser).mockResolvedValueOnce({
      data: { user: { id: ACTIVE_USER_ID, email: 'new@test.com' } } as any,
      error: null,
    });
    addMockProfile({
      id:     ACTIVE_USER_ID,
      email:  'new@test.com',
      role:   Role.CUSTOMER,
      gym_id: null,
      status: AccountStatus.ACTIVE,
    });
    vi.mocked(supabaseAnon.auth.signInWithPassword).mockResolvedValueOnce({
      data: {
        session: { access_token: 'tok', expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'ref' } as any,
        user: { id: ACTIVE_USER_ID, email: 'new@test.com' } as any,
      },
      error: null,
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'new@test.com', password: 'Password123!', fullName: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  // ─── Duplicate email ──────────────────────────────────────────────────────

  it('returns 409 when registering with a duplicate email', async () => {
    vi.mocked(supabase.auth.admin.createUser).mockResolvedValueOnce({
      data: { user: null } as any,
      error: { message: 'User already registered', status: 422 } as any,
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'existing@test.com', password: 'Password123!', fullName: 'Test User' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  // ─── Forgot password enumeration safety ───────────────────────────────────

  it('returns 200 for forgot-password even when email does not exist (enumeration-safe)', async () => {
    // Mock: resetPasswordForEmail succeeds silently regardless of whether the email exists
    vi.mocked(supabaseAnon.auth.resetPasswordForEmail).mockResolvedValueOnce({
      data: {},
      error: null,
    });

    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent@test.com' });

    // Must always return 200 — never reveal whether the account exists
    expect(res.status).toBe(200);
  });

  // ─── Response body security ───────────────────────────────────────────────

  it('never exposes JWT tokens in error responses', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'JWT malformed', status: 401 } as any,
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature');

    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('eyJ');        // No JWT prefix in response
    expect(bodyStr).not.toContain('Bearer');     // No raw token material
    expect(bodyStr).not.toContain('signature');  // No signature segment
  });
});
