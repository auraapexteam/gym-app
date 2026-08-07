import { Request, Response } from 'express';
import { PlanService } from '@/modules/plans/plans.service';
import { currentUser, requireGymId, parseListQuery, buildPaginationMeta } from '@/shared/utils';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '@/shared/responses';
import { BadRequestError } from '@/shared/errors';
import { Role } from '@/shared/rbac';

export class PlanController {
  /**
   * List plans. Owners/staff see their own gym's plans; customers browse a
   * specific gym's *active* plans via the `gymId` query parameter.
   */
  static async list(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const query = parseListQuery(req.query);

    let gymId: string;
    let isActive: boolean | undefined;

    if (user.role === Role.CUSTOMER) {
      const requested = req.query.gymId;
      const targetGymId = typeof requested === 'string' && requested ? requested : user.gymId;
      if (!targetGymId) {
        throw new BadRequestError('gymId query parameter is required or user must be linked to a gym', 'GYM_ID_REQUIRED');
      }
      gymId = targetGymId;
      isActive = true; // customers only ever see purchasable plans
    } else {
      gymId = requireGymId(user);
      isActive = typeof req.query.isActive === 'boolean' ? req.query.isActive : undefined;
    }

    const { items, total } = await PlanService.list(gymId, query, { isActive });
    return sendPaginated(res, items, buildPaginationMeta(total, query.page, query.limit));
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const plan = await PlanService.getById(gymId, req.params.id);
    return sendSuccess(res, plan, 'Plan fetched successfully');
  }

  static async create(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const plan = await PlanService.create(gymId, req.body);
    return sendCreated(res, plan, 'Plan created successfully');
  }

  static async update(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const plan = await PlanService.update(gymId, req.params.id, req.body);
    return sendSuccess(res, plan, 'Plan updated successfully');
  }

  static async activate(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const plan = await PlanService.setActive(gymId, req.params.id, true);
    return sendSuccess(res, plan, 'Plan activated');
  }

  static async deactivate(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const plan = await PlanService.setActive(gymId, req.params.id, false);
    return sendSuccess(res, plan, 'Plan deactivated');
  }

  static async remove(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    await PlanService.remove(gymId, req.params.id);
    return sendNoContent(res);
  }
}
