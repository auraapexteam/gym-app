import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { supabase } from '@/config/supabase';
import { Role } from '@/shared/rbac';
import { mockTable, resetMocks, setupAuthUser } from './utils/test-helpers';

const app = createApp();
const originalFrom = vi.mocked(supabase.from).getMockImplementation()!;
const profileId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba7';
const otherProfileId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba8';
const gymId = '47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2';
const logDate = '2026-09-15';
const writes = [
  ['weight', 'progress_logs', { weight: 75 }, 'WEIGHT_LOG_FAILED'],
  ['water', 'water_logs', { amountMl: 2500 }, 'WATER_LOG_FAILED'],
  ['protein', 'protein_logs', { amountG: 125 }, 'PROTEIN_LOG_FAILED'],
  ['steps', 'steps_logs', { steps: 8500 }, 'STEPS_LOG_FAILED'],
  ['note', 'notes_logs', { note: 'Synthetic persistence test' }, 'NOTE_LOG_FAILED'],
  ['sleep', 'sleep_logs', { durationMinutes: 465 }, 'SLEEP_LOG_FAILED'],
] as const;

describe('Progress persistence and read failures', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockImplementation(originalFrom);
    resetMocks();
    setupAuthUser(Role.CUSTOMER, gymId, profileId);
  });

  it.each(writes)('returns a safe failure when the %s write is rejected by storage', async (route, table, payload, code) => {
    const chain: any = {
      upsert: vi.fn(() => chain),
      select: vi.fn(() => chain),
      single: vi.fn(async () => ({
        data: null,
        error: { code: 'PGRST205', message: `private SQL failure for ${table}: synthetic database detail` },
      })),
    };
    vi.mocked(supabase.from).mockImplementation(((name: string) => name === table ? chain : originalFrom(name)) as any);
    const res = await request(app).post(`/api/v1/progress/${route}`)
      .set('Authorization', `Bearer ${profileId}`).send({ ...payload, logDate });
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(code);
    expect(JSON.stringify(res.body)).not.toContain('private SQL');
    expect(res.body.data).toBeUndefined();
  });

  it.each(writes)('does not report a saved %s when storage returns no row', async (route, table, payload, code) => {
    const chain: any = {
      upsert: vi.fn(() => chain),
      select: vi.fn(() => chain),
      single: vi.fn(async () => ({ data: null, error: null })),
    };
    vi.mocked(supabase.from).mockImplementation(((name: string) => name === table ? chain : originalFrom(name)) as any);
    const res = await request(app).post(`/api/v1/progress/${route}`)
      .set('Authorization', `Bearer ${profileId}`).send({ ...payload, logDate });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe(code);
  });

  it('saves and updates one steps row, then reads only the authenticated profile', async () => {
    const rows: any[] = [{ id: 'other-person', profile_id: otherProfileId, steps: 9999, log_date: logDate }];
    const upsert = vi.fn();
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table !== 'steps_logs') return originalFrom(table);
      let write: any;
      const filters: Array<(row: any) => boolean> = [];
      const chain: any = {
        upsert: (payload: any, options: any) => { write = payload; upsert(payload, options); return chain; },
        select: () => chain,
        eq: (column: string, value: any) => { filters.push((row) => row[column] === value); return chain; },
        gte: (column: string, value: any) => { filters.push((row) => row[column] >= value); return chain; },
        lte: (column: string, value: any) => { filters.push((row) => row[column] <= value); return chain; },
        single: async () => {
          const index = rows.findIndex((row) => row.profile_id === write.profile_id && row.log_date === write.log_date);
          const row = { id: index < 0 ? 'saved-steps' : rows[index].id, ...write };
          if (index < 0) rows.push(row); else rows[index] = row;
          return { data: row, error: null };
        },
        then: (resolve: any) => Promise.resolve(resolve({ data: rows.filter((row) => filters.every((filter) => filter(row))), error: null })),
      };
      return chain;
    }) as any);

    for (const steps of [8500, 9000]) {
      const save = await request(app).post('/api/v1/progress/steps')
        .set('Authorization', `Bearer ${profileId}`)
        .send({ steps, logDate, profileId: otherProfileId });
      expect(save.status).toBe(200);
      expect(save.body.data).toMatchObject({ profile_id: profileId, steps, log_date: logDate });
    }
    expect(upsert).toHaveBeenLastCalledWith(expect.objectContaining({ profile_id: profileId, steps: 9000 }), { onConflict: 'profile_id,log_date' });
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.id === 'other-person').steps).toBe(9999);

    const read = await request(app).get('/api/v1/progress/month?year=2026&month=9')
      .set('Authorization', `Bearer ${profileId}`);
    expect(read.status).toBe(200);
    expect(read.body.data.stepsLogs).toEqual([expect.objectContaining({ id: 'saved-steps', steps: 9000, log_date: logDate })]);
  });

  it.each(['progress_logs', 'water_logs', 'protein_logs', 'steps_logs', 'progress_images', 'notes_logs', 'sleep_logs'])
  ('fails the month summary when %s could not be read', async (table) => {
    mockTable(table, [], { code: 'PGRST205', message: 'private database diagnostics' });
    const res = await request(app).get('/api/v1/progress/month?year=2026&month=9')
      .set('Authorization', `Bearer ${profileId}`);
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('PROGRESS_SUMMARY_FAILED');
    expect(res.body.data).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('private database');
  });
});
