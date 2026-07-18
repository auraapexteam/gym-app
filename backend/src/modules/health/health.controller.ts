import { Request, Response } from 'express';
import { HealthService } from '@/modules/health/health.service';
import { sendSuccess } from '@/shared/responses';

export class HealthController {
  /** Full health report (always 200 with component statuses). */
  static async health(_req: Request, res: Response): Promise<Response> {
    const report = await HealthService.report();
    return sendSuccess(res, report, 'Health check');
  }

  /** Readiness probe — 503 until the database is reachable. */
  static async ready(_req: Request, res: Response): Promise<Response> {
    const dbUp = await HealthService.checkDatabase();
    if (!dbUp) {
      return res.status(503).json({
        success: false,
        message: 'Not ready',
        error: { code: 'NOT_READY' },
      });
    }
    return sendSuccess(res, { ready: true }, 'Ready');
  }

  /** Liveness probe — 200 while the process is running. */
  static live(_req: Request, res: Response): Response {
    return sendSuccess(res, { status: 'alive' }, 'Alive');
  }
}
