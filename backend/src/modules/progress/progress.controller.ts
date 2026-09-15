import { Request, Response } from 'express';
import { ProgressService } from '@/modules/progress/progress.service';
import { currentUser } from '@/shared/utils';
import { sendSuccess } from '@/shared/responses';

export class ProgressController {
  /** Log daily weight. */
  static async logWeight(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const { weight, logDate } = req.body;
    const log = await ProgressService.logWeight(user.id, weight, logDate);
    return sendSuccess(res, log, 'Weight logged successfully');
  }

  /** Log daily water intake. */
  static async logWater(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const { amountMl, logDate } = req.body;
    const log = await ProgressService.logWater(user.id, amountMl, logDate);
    return sendSuccess(res, log, 'Water intake logged successfully');
  }

  /** Log daily protein intake. */
  static async logProtein(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const { amountG, logDate } = req.body;
    const log = await ProgressService.logProtein(user.id, amountG, logDate);
    return sendSuccess(res, log, 'Protein intake logged successfully');
  }

  /** Log daily steps. */
  static async logSteps(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const { steps, logDate } = req.body;
    const log = await ProgressService.logSteps(user.id, steps, logDate);
    return sendSuccess(res, log, 'Steps logged successfully');
  }

  /** Log daily note. */
  static async logNote(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const { note, logDate } = req.body;
    const log = await ProgressService.logNote(user.id, note, logDate);
    return sendSuccess(res, log, 'Daily note saved successfully');
  }

  /** Log daily sleep. */
  static async logSleep(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const { durationMinutes, quality, logDate } = req.body;
    const log = await ProgressService.logSleep(user.id, durationMinutes, quality, logDate);
    return sendSuccess(res, log, 'Sleep log saved successfully');
  }

  /** Log daily progress photo. */
  static async logImage(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const { imageUrl, logDate } = req.body;
    const log = await ProgressService.logImage(user.id, imageUrl, logDate);
    return sendSuccess(res, log, 'Progress image saved successfully');
  }

  /** Fetch summary logs for a calendar month. */
  static async getMonthSummary(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    // Values are validated and cast by Zod validator
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    const summary = await ProgressService.getMonthSummary(user.id, year, month);
    return sendSuccess(res, summary, 'Month summary fetched successfully');
  }
}
