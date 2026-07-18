import { Request, Response } from 'express';
import { AnalyticsService } from '@/modules/analytics/analytics.service';
import { currentUser, requireGymId } from '@/shared/utils';
import { sendSuccess } from '@/shared/responses';

export class AnalyticsController {
  static async dashboard(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const data = await AnalyticsService.dashboard(gymId);
    return sendSuccess(res, data, 'Dashboard fetched successfully');
  }

  static async revenue(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    const data = await AnalyticsService.revenueSeries(gymId, from, to);
    return sendSuccess(res, data, 'Revenue series fetched successfully');
  }

  static async attendance(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    const data = await AnalyticsService.attendanceSeries(gymId, from, to);
    return sendSuccess(res, data, 'Attendance series fetched successfully');
  }
}
