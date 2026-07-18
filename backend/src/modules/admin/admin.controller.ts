import { Request, Response } from 'express';
import { AdminService } from '@/modules/admin/admin.service';
import { AuditService } from '@/shared/services';
import { currentUser, parseListQuery, buildPaginationMeta, clientIp } from '@/shared/utils';
import { sendSuccess, sendCreated, sendPaginated } from '@/shared/responses';

export class AdminController {
  static async onboardGym(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const result = await AdminService.onboardGym(req.body);

    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      gymId: result.gym.id,
      action: 'admin.gym_onboarded',
      resourceType: 'gym',
      resourceId: result.gym.id,
      ipAddress: clientIp(req),
    });

    return sendCreated(res, result, 'Gym onboarded successfully');
  }

  static async listGyms(req: Request, res: Response): Promise<Response> {
    const query = parseListQuery(req.query);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const { items, total } = await AdminService.listGyms(query, status);
    return sendPaginated(res, items, buildPaginationMeta(total, query.page, query.limit));
  }

  static async getGym(req: Request, res: Response): Promise<Response> {
    return sendSuccess(res, await AdminService.getGym(req.params.id), 'Gym fetched successfully');
  }

  static async suspendGym(req: Request, res: Response): Promise<Response> {
    return AdminController.changeStatus(req, res,'suspend', 'Gym suspended');
  }

  static async activateGym(req: Request, res: Response): Promise<Response> {
    return AdminController.changeStatus(req, res,'activate', 'Gym activated');
  }

  static async approveGym(req: Request, res: Response): Promise<Response> {
    return AdminController.changeStatus(req, res,'approve', 'Gym approved');
  }

  static async platformStats(_req: Request, res: Response): Promise<Response> {
    return sendSuccess(res, await AdminService.platformStats(), 'Platform stats fetched successfully');
  }

  static async listAuditLogs(req: Request, res: Response): Promise<Response> {
    const query = parseListQuery(req.query);
    const gymId = typeof req.query.gymId === 'string' ? req.query.gymId : undefined;
    const action = typeof req.query.action === 'string' ? req.query.action : undefined;
    const { items, total } = await AdminService.listAuditLogs(query, { gymId, action });
    return sendPaginated(res, items, buildPaginationMeta(total, query.page, query.limit));
  }

  private static async changeStatus(
    req: Request,
    res: Response,
    kind: 'suspend' | 'activate' | 'approve',
    message: string,
  ): Promise<Response> {
    const user = currentUser(req);
    const id = req.params.id;
    const gym =
      kind === 'suspend'
        ? await AdminService.suspendGym(id)
        : kind === 'approve'
          ? await AdminService.approveGym(id)
          : await AdminService.activateGym(id);

    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      gymId: id,
      action: `admin.gym_${kind}`,
      resourceType: 'gym',
      resourceId: id,
      ipAddress: clientIp(req),
    });

    return sendSuccess(res, gym, message);
  }
}
