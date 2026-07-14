import { Request, Response } from 'express';
import { GymService } from '@/modules/gym/gym.service';
import { AuditService } from '@/shared/services';
import { currentUser, requireGymId, clientIp } from '@/shared/utils';
import { sendSuccess } from '@/shared/responses';

export class GymController {
  /** Fetch the authenticated user's own gym. */
  static async getMine(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const gym = await GymService.getById(gymId);
    return sendSuccess(res, gym, 'Gym fetched successfully');
  }

  /** Update the authenticated user's own gym. */
  static async updateMine(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const gymId = requireGymId(user);
    const gym = await GymService.update(gymId, req.body);

    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      gymId,
      action: 'gym.updated',
      resourceType: 'gym',
      resourceId: gymId,
      ipAddress: clientIp(req),
    });

    return sendSuccess(res, gym, 'Gym updated successfully');
  }

  /** Public gym profile (customer-facing). */
  static async getPublic(req: Request, res: Response): Promise<Response> {
    const gym = await GymService.getPublicById(req.params.id);
    return sendSuccess(res, gym, 'Gym fetched successfully');
  }
}
