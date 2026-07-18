import { Request, Response } from 'express';
import { GalleryService } from '@/modules/gallery/gallery.service';
import { currentUser, requireGymId, parseListQuery, buildPaginationMeta } from '@/shared/utils';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '@/shared/responses';
import { BadRequestError } from '@/shared/errors';
import { Role } from '@/shared/rbac';

export class GalleryController {
  static async createUploadUrl(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const target = await GalleryService.createUploadUrl(gymId, req.body);
    return sendCreated(res, target, 'Upload URL created');
  }

  static async register(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const gymId = requireGymId(user);
    const image = await GalleryService.register(gymId, user.id, req.body);
    return sendCreated(res, image, 'Image registered successfully');
  }

  /** Owners/staff list their gym's images; customers pass an explicit gymId. */
  static async list(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const query = parseListQuery(req.query);
    const entityType = typeof req.query.entityType === 'string' ? req.query.entityType : undefined;
    const entityId = typeof req.query.entityId === 'string' ? req.query.entityId : undefined;

    let gymId: string;
    if (user.role === Role.CUSTOMER) {
      const requested = req.query.gymId;
      if (typeof requested !== 'string') {
        throw new BadRequestError('gymId query parameter is required', 'GYM_ID_REQUIRED');
      }
      gymId = requested;
    } else {
      gymId = requireGymId(user);
    }

    const { items, total } = await GalleryService.list(gymId, query, { entityType, entityId });
    return sendPaginated(res, items, buildPaginationMeta(total, query.page, query.limit));
  }

  static async remove(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    await GalleryService.remove(gymId, req.params.id);
    return sendNoContent(res);
  }
}
