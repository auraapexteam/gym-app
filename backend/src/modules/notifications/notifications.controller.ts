import { Request, Response } from 'express';
import { NotificationService } from '@/modules/notifications/notifications.service';
import { currentUser, parseListQuery, buildPaginationMeta } from '@/shared/utils';
import { sendSuccess, sendPaginated } from '@/shared/responses';

export class NotificationController {
  static async list(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const query = parseListQuery(req.query);
    const { items, total } = await NotificationService.list(user.id, query);
    return sendPaginated(res, items, buildPaginationMeta(total, query.page, query.limit));
  }

  static async unreadCount(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const count = await NotificationService.unreadCount(user.id);
    return sendSuccess(res, { count }, 'Unread count fetched successfully');
  }

  static async markRead(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const notification = await NotificationService.markRead(user.id, req.params.id);
    return sendSuccess(res, notification, 'Notification marked as read');
  }

  static async markAllRead(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    await NotificationService.markAllRead(user.id);
    return sendSuccess(res, null, 'All notifications marked as read');
  }
}
