import { Request, Response } from 'express';
import { AttendanceService } from '@/modules/attendance/attendance.service';
import { currentUser, requireGymId, parseListQuery, buildPaginationMeta } from '@/shared/utils';
import { sendSuccess, sendCreated, sendPaginated } from '@/shared/responses';

export class AttendanceController {
  /** Customer QR check-in. */
  static async checkIn(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const attendance = await AttendanceService.checkInViaQr(user, req.body.token);
    return sendCreated(res, attendance, 'Checked in successfully');
  }

  /** Staff manual check-in. */
  static async manualCheckIn(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const attendance = await AttendanceService.manualCheckIn(gymId, req.body.memberId);
    return sendCreated(res, attendance, 'Attendance recorded');
  }

  /** Customer's own attendance history. */
  static async me(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const history = await AttendanceService.historyForProfile(user.id);
    return sendSuccess(res, history, 'Attendance history fetched successfully');
  }

  static async list(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const query = parseListQuery(req.query);
    const memberId = typeof req.query.memberId === 'string' ? req.query.memberId : undefined;
    const dateFrom = typeof req.query.dateFrom === 'string' ? req.query.dateFrom : undefined;
    const dateTo = typeof req.query.dateTo === 'string' ? req.query.dateTo : undefined;

    const { items, total } = await AttendanceService.listForGym(gymId, query, {
      memberId,
      dateFrom,
      dateTo,
    });
    return sendPaginated(res, items, buildPaginationMeta(total, query.page, query.limit));
  }

  static async stats(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const stats = await AttendanceService.stats(gymId);
    return sendSuccess(res, stats, 'Attendance stats fetched successfully');
  }
}
