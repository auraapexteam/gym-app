import { Request, Response } from 'express';
import { EquipmentService } from '@/modules/equipment/equipment.service';
import { currentUser, requireGymId, parseListQuery, buildPaginationMeta } from '@/shared/utils';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '@/shared/responses';

export class EquipmentController {
  static async list(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const query = parseListQuery(req.query);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const condition = typeof req.query.condition === 'string' ? req.query.condition : undefined;
    const { items, total } = await EquipmentService.list(gymId, query, { status, condition });
    return sendPaginated(res, items, buildPaginationMeta(total, query.page, query.limit));
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    return sendSuccess(res, await EquipmentService.getById(gymId, req.params.id), 'Equipment fetched successfully');
  }

  static async create(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    return sendCreated(res, await EquipmentService.create(gymId, req.body), 'Equipment created successfully');
  }

  static async update(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    return sendSuccess(res, await EquipmentService.update(gymId, req.params.id, req.body), 'Equipment updated successfully');
  }

  static async remove(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    await EquipmentService.remove(gymId, req.params.id);
    return sendNoContent(res);
  }
}
