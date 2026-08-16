import { Request, Response } from 'express';
import { WorkoutService } from '@/modules/workouts/workout.service';
import { AuditService } from '@/shared/services';
import { currentUser, clientIp } from '@/shared/utils';
import { sendSuccess, sendCreated } from '@/shared/responses';

export class WorkoutController {
  /** Return workout history for the authenticated user. */
  static async getHistory(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;

    const history = await WorkoutService.listHistory(user.id, limit, offset);
    return sendSuccess(res, history, 'Workout history retrieved successfully');
  }

  /** Log a new workout entry. */
  static async logWorkout(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const workout = await WorkoutService.logWorkout(user.id, req.body);

    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      gymId: user.gymId,
      action: 'workout.logged',
      resourceType: 'workout_logs',
      resourceId: workout.id,
      ipAddress: clientIp(req),
    });

    return sendCreated(res, workout, 'Workout logged successfully');
  }
}
