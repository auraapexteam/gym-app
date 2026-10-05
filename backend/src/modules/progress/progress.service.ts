import { supabase } from '@/config/supabase';
import { ServiceUnavailableError } from '@/shared/errors';
import { PrivateMediaService } from '@/shared/services/private-media.service';

export class ProgressService {
  /** Upsert weight log for a specific date. */
  static async logWeight(profileId: string, weight: number, logDate: string): Promise<any> {
    const { data, error } = await supabase
      .from('progress_logs')
      .upsert(
        { profile_id: profileId, weight, log_date: logDate, updated_at: new Date().toISOString() },
        { onConflict: 'profile_id,log_date' }
      )
      .select()
      .single();

    if (error || !data) throw new ServiceUnavailableError('Unable to save weight log. Please try again.', 'WEIGHT_LOG_FAILED');
    return data;
  }

  /** Upsert water log for a specific date. */
  static async logWater(profileId: string, amountMl: number, logDate: string): Promise<any> {
    const { data, error } = await supabase
      .from('water_logs')
      .upsert(
        { profile_id: profileId, amount_ml: amountMl, log_date: logDate, updated_at: new Date().toISOString() },
        { onConflict: 'profile_id,log_date' }
      )
      .select()
      .single();

    if (error || !data) throw new ServiceUnavailableError('Unable to save water log. Please try again.', 'WATER_LOG_FAILED');
    return data;
  }

  /** Upsert protein log for a specific date. */
  static async logProtein(profileId: string, amountG: number, logDate: string): Promise<any> {
    const { data, error } = await supabase
      .from('protein_logs')
      .upsert(
        { profile_id: profileId, amount_g: amountG, log_date: logDate, updated_at: new Date().toISOString() },
        { onConflict: 'profile_id,log_date' }
      )
      .select()
      .single();

    if (error || !data) throw new ServiceUnavailableError('Unable to save protein log. Please try again.', 'PROTEIN_LOG_FAILED');
    return data;
  }

  /** Upsert steps log for a specific date. */
  static async logSteps(profileId: string, steps: number, logDate: string): Promise<any> {
    const { data, error } = await supabase
      .from('steps_logs')
      .upsert(
        { profile_id: profileId, steps, log_date: logDate, updated_at: new Date().toISOString() },
        { onConflict: 'profile_id,log_date' }
      )
      .select()
      .single();

    if (error || !data) throw new ServiceUnavailableError('Unable to save steps log. Please try again.', 'STEPS_LOG_FAILED');
    return data;
  }

  /** Upsert daily note log for a specific date. */
  static async logNote(profileId: string, note: string, logDate: string): Promise<any> {
    const { data, error } = await supabase
      .from('notes_logs')
      .upsert(
        { profile_id: profileId, note, log_date: logDate, updated_at: new Date().toISOString() },
        { onConflict: 'profile_id,log_date' }
      )
      .select()
      .single();

    if (error || !data) throw new ServiceUnavailableError('Unable to save daily note. Please try again.', 'NOTE_LOG_FAILED');
    return data;
  }

  /** Upsert daily sleep log for a specific date. */
  static async logSleep(profileId: string, durationMinutes: number, quality: string = 'Good', logDate: string): Promise<any> {
    const { data, error } = await supabase
      .from('sleep_logs')
      .upsert(
        { profile_id: profileId, duration_minutes: durationMinutes, quality, log_date: logDate, updated_at: new Date().toISOString() },
        { onConflict: 'profile_id,log_date' }
      )
      .select()
      .single();

    if (error || !data) throw new ServiceUnavailableError('Unable to save sleep log. Please try again.', 'SLEEP_LOG_FAILED');
    return data;
  }

  /** Upsert progress photo log for a specific date. */
  static async logImage(profileId: string, imageUrl: string, logDate: string): Promise<any> {
    PrivateMediaService.assertOwnedPath(profileId, imageUrl, 'progress-photo');
    const signedUrl = await PrivateMediaService.signedReadUrl(profileId, imageUrl, 'progress-photo');
    const { data, error } = await supabase
      .from('progress_images')
      .upsert(
        { profile_id: profileId, image_url: imageUrl, log_date: logDate },
        { onConflict: 'profile_id,log_date' }
      )
      .select()
      .single();

    if (error || !data) throw new ServiceUnavailableError('Unable to save progress image. Please try again.', 'IMAGE_LOG_FAILED');
    return { ...data, image_path: imageUrl, image_url: signedUrl };
  }

  /** Fetch all progress logs aggregated for a given calendar month. */
  static async getMonthSummary(profileId: string, year: number, month: number): Promise<any> {
    // Format calendar month boundaries
    const monthPad = String(month).padStart(2, '0');
    const startDate = `${year}-${monthPad}-01`;
    
    // Find last day of month
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${monthPad}-${String(lastDay).padStart(2, '0')}`;

    // A failed read must not look like an empty logbook; callers can retry.
    const [weightRes, waterRes, proteinRes, stepsRes, imageRes, notesRes, sleepRes] = await Promise.all([
      supabase.from('progress_logs').select('id, weight, log_date').eq('profile_id', profileId).gte('log_date', startDate).lte('log_date', endDate),
      supabase.from('water_logs').select('id, amount_ml, log_date').eq('profile_id', profileId).gte('log_date', startDate).lte('log_date', endDate),
      supabase.from('protein_logs').select('id, amount_g, log_date').eq('profile_id', profileId).gte('log_date', startDate).lte('log_date', endDate),
      supabase.from('steps_logs').select('id, steps, log_date').eq('profile_id', profileId).gte('log_date', startDate).lte('log_date', endDate),
      supabase.from('progress_images').select('id, image_url, log_date').eq('profile_id', profileId).gte('log_date', startDate).lte('log_date', endDate),
      supabase.from('notes_logs').select('id, note, log_date').eq('profile_id', profileId).gte('log_date', startDate).lte('log_date', endDate),
      supabase.from('sleep_logs').select('id, duration_minutes, quality, log_date').eq('profile_id', profileId).gte('log_date', startDate).lte('log_date', endDate),
    ]);

    if ([weightRes, waterRes, proteinRes, stepsRes, imageRes, notesRes, sleepRes].some((result) => result.error)) {
      throw new ServiceUnavailableError('Unable to load progress logs. Please try again.', 'PROGRESS_SUMMARY_FAILED');
    }

    return {
      weightLogs: weightRes.data || [],
      waterLogs: waterRes.data || [],
      proteinLogs: proteinRes.data || [],
      stepsLogs: stepsRes.data || [],
      imageLogs: await Promise.all((imageRes.data || []).map(async (row: any) => {
        // Legacy public references require an explicit object migration. Do not
        // advertise them as private or mint access to an arbitrary foreign URL.
        if (typeof row.image_url !== 'string' || !row.image_url.startsWith(`personal/${profileId}/progress-photo/`)) {
          return { id: row.id, log_date: row.log_date, image_url: null, unavailable: true };
        }
        try {
          return { ...row, image_path: row.image_url, image_url: await PrivateMediaService.signedReadUrl(profileId, row.image_url, 'progress-photo') };
        } catch {
          return { id: row.id, log_date: row.log_date, image_path: row.image_url, image_url: null, unavailable: true };
        }
      })),
      notesLogs: notesRes.data || [],
      sleepLogs: sleepRes.data || [],
    };
  }
}
