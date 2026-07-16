import { Request, Response } from 'express';
import { QrService } from '@/modules/qr/qr.service';
import { AuditService } from '@/shared/services';
import { currentUser, requireGymId, parseListQuery, buildPaginationMeta, clientIp } from '@/shared/utils';
import { sendSuccess, sendCreated, sendPaginated } from '@/shared/responses';

export class QrController {
  static async getActive(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const qr = await QrService.getActive(gymId);
    return sendSuccess(res, qr, 'Active QR fetched successfully');
  }

  static async list(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const query = parseListQuery(req.query);
    const { items, total } = await QrService.list(gymId, query);
    return sendPaginated(res, items, buildPaginationMeta(total, query.page, query.limit));
  }

  static async generate(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const gymId = requireGymId(user);
    const qr = await QrService.generate(gymId, user.id, req.body);

    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      gymId,
      action: 'qr.generated',
      resourceType: 'qr_code',
      resourceId: qr.id,
      ipAddress: clientIp(req),
    });

    return sendCreated(res, qr, 'QR generated');
  }

  static async revoke(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const gymId = requireGymId(user);
    const qr = await QrService.revoke(gymId, req.params.id);

    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      gymId,
      action: 'qr.revoked',
      resourceType: 'qr_code',
      resourceId: qr.id,
      ipAddress: clientIp(req),
    });

    return sendSuccess(res, qr, 'QR revoked');
  }
}
