import { Request, Response } from 'express';
import { SubscriptionService } from '@/modules/subscriptions/subscriptions.service';
import { AuditService } from '@/shared/services';
import { currentUser, requireGymId, parseListQuery, buildPaginationMeta, clientIp } from '@/shared/utils';
import { sendSuccess, sendCreated, sendPaginated } from '@/shared/responses';

export class SubscriptionController {
  static async list(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const query = parseListQuery(req.query);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const memberId = typeof req.query.memberId === 'string' ? req.query.memberId : undefined;

    const { items, total } = await SubscriptionService.listForGym(gymId, query, { status, memberId });
    return sendPaginated(res, items, buildPaginationMeta(total, query.page, query.limit));
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const sub = await SubscriptionService.getById(gymId, req.params.id);
    return sendSuccess(res, sub, 'Subscription fetched successfully');
  }

  /** Current customer's subscriptions across all gyms they belong to. */
  static async me(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const subs = await SubscriptionService.listForProfile(user.id);
    return sendSuccess(res, subs, 'Subscriptions fetched successfully');
  }

  static async cancel(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const gymId = requireGymId(user);
    const sub = await SubscriptionService.cancel(gymId, req.params.id);

    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      gymId,
      action: 'subscription.cancelled',
      resourceType: 'subscription',
      resourceId: sub.id,
      ipAddress: clientIp(req),
    });

    return sendSuccess(res, sub, 'Subscription cancelled');
  }

  static async createManual(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const gymId = requireGymId(user);
    const sub = await SubscriptionService.createManual(gymId, req.body);

    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      gymId,
      action: 'subscription.manual_created',
      resourceType: 'subscription',
      resourceId: sub.id,
      ipAddress: clientIp(req),
    });

    return sendCreated(res, sub, 'Membership created');
  }
}
