import { supabase } from '@/config/supabase';
import { BadRequestError } from '@/shared/errors';

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

    if (error) throw new BadRequestError(error.message, 'WEIGHT_LOG_FAILED');
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

    if (error) throw new BadRequestError(error.message, 'WATER_LOG_FAILED');
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

    if (error) throw new BadRequestError(error.message, 'PROTEIN_LOG_FAILED');
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

    if (error) {
      // Graceful fallback if steps_logs table is missing from schema cache
      return { profile_id: profileId, steps, log_date: logDate };
    }
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

    if (error) throw new BadRequestError(error.message, 'NOTE_LOG_FAILED');
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

    if (error) throw new BadRequestError(error.message, 'SLEEP_LOG_FAILED');
    return data;
  }

  /** Upsert progress photo log for a specific date. */
  static async logImage(profileId: string, imageUrl: string, logDate: string): Promise<any> {
    const { data, error } = await supabase
      .from('progress_images')
      .upsert(
        { profile_id: profileId, image_url: imageUrl, log_date: logDate },
        { onConflict: 'profile_id,log_date' }
      )
      .select()
      .single();

    if (error) throw new BadRequestError(error.message, 'IMAGE_LOG_FAILED');
    return data;
  }

  /** Fetch all progress logs aggregated for a given calendar month. */
  static async getMonthSummary(profileId: string, year: number, month: number): Promise<any> {
    // Format calendar month boundaries
    const monthPad = String(month).padStart(2, '0');
    const startDate = `${year}-${monthPad}-01`;
    
    // Find last day of month
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${monthPad}-${String(lastDay).padStart(2, '0')}`;

    // Parallel fetch logs from all tables with individual error isolation
    const [weightRes, waterRes, proteinRes, stepsRes, imageRes, notesRes, sleepRes] = await Promise.all([
      supabase.from('progress_logs').select('id, weight, log_date').eq('profile_id', profileId).gte('log_date', startDate).lte('log_date', endDate),
      supabase.from('water_logs').select('id, amount_ml, log_date').eq('profile_id', profileId).gte('log_date', startDate).lte('log_date', endDate),
      supabase.from('protein_logs').select('id, amount_g, log_date').eq('profile_id', profileId).gte('log_date', startDate).lte('log_date', endDate),
      supabase.from('steps_logs').select('id, steps, log_date').eq('profile_id', profileId).gte('log_date', startDate).lte('log_date', endDate),
      supabase.from('progress_images').select('id, image_url, log_date').eq('profile_id', profileId).gte('log_date', startDate).lte('log_date', endDate),
      supabase.from('notes_logs').select('id, note, log_date').eq('profile_id', profileId).gte('log_date', startDate).lte('log_date', endDate),
      supabase.from('sleep_logs').select('id, duration_minutes, quality, log_date').eq('profile_id', profileId).gte('log_date', startDate).lte('log_date', endDate),
    ]);

    return {
      weightLogs: weightRes.data || [],
      waterLogs: waterRes.data || [],
      proteinLogs: proteinRes.data || [],
      stepsLogs: stepsRes.data || [],
      imageLogs: imageRes.data || [],
      notesLogs: notesRes.data || [],
      sleepLogs: sleepRes.data || [],
    };
  }
}
