import { Request, Response } from 'express';
import { MemberService } from '@/modules/members/members.service';
import { currentUser, requireGymId, parseListQuery, buildPaginationMeta } from '@/shared/utils';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '@/shared/responses';

/**
 * Thin HTTP layer for members. Reads request data, calls the service, returns a
 * standardized response. No business logic, no database access.
 */
export class MemberController {
  static async list(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const query = parseListQuery(req.query);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    const { items, total } = await MemberService.list(gymId, query, status);
    return sendPaginated(res, items, buildPaginationMeta(total, query.page, query.limit));
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const member = await MemberService.getById(gymId, req.params.id);
    return sendSuccess(res, member, 'Member fetched successfully');
  }

  static async create(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const member = await MemberService.create(gymId, req.body);
    return sendCreated(res, member, 'Member created successfully');
  }

  static async update(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const member = await MemberService.update(gymId, req.params.id, req.body);
    return sendSuccess(res, member, 'Member updated successfully');
  }

  static async remove(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    await MemberService.remove(gymId, req.params.id);
    return sendNoContent(res);
  }
}
