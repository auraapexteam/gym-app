import { Request, Response } from 'express';
import { TrainerService } from '@/modules/trainers/trainers.service';
import { currentUser, requireGymId, parseListQuery, buildPaginationMeta } from '@/shared/utils';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '@/shared/responses';

export class TrainerController {
  static async list(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const query = parseListQuery(req.query);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const { items, total } = await TrainerService.list(gymId, query, status);
    return sendPaginated(res, items, buildPaginationMeta(total, query.page, query.limit));
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    return sendSuccess(res, await TrainerService.getById(gymId, req.params.id), 'Trainer fetched successfully');
  }

  static async create(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    return sendCreated(res, await TrainerService.create(gymId, req.body), 'Trainer created successfully');
  }

  static async update(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    return sendSuccess(res, await TrainerService.update(gymId, req.params.id, req.body), 'Trainer updated successfully');
  }

  static async remove(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    await TrainerService.remove(gymId, req.params.id);
    return sendNoContent(res);
  }
}
