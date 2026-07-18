import { supabase } from '@/config/supabase';
import { env } from '@/config/env';

export interface HealthReport {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
  storage: 'up' | 'down';
  version: string;
  uptime: number;
  environment: string;
}

/** Liveness/readiness checks used by the deployment platform and monitoring. */
export class HealthService {
  static async checkDatabase(): Promise<boolean> {
    try {
      const { error } = await supabase.from('gyms').select('id', { head: true, count: 'exact' }).limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  static async checkStorage(): Promise<boolean> {
    try {
      const { error } = await supabase.storage.listBuckets();
      return !error;
    } catch {
      return false;
    }
  }

  static async report(): Promise<HealthReport> {
    const [database, storage] = await Promise.all([this.checkDatabase(), this.checkStorage()]);
    return {
      status: database ? 'ok' : 'degraded',
      database: database ? 'up' : 'down',
      storage: storage ? 'up' : 'down',
      version: env.API_VERSION,
      uptime: Math.floor(process.uptime()),
      environment: env.NODE_ENV,
    };
  }
}
