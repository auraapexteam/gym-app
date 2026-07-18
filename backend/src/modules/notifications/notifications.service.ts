import { notificationRepository } from '@/modules/notifications/notifications.repository';
import { toNotificationDto } from '@/modules/notifications/notifications.dto';
import {
  NotificationDto,
  NotifyInput,
} from '@/modules/notifications/notifications.types';
import { ListQuery, PaginatedResult } from '@/shared/types';
import { NotFoundError } from '@/shared/errors';

/**
 * Notifications. Delivery is event-driven: other modules call `notify()` to
 * enqueue a notification. This module is intentionally decoupled — it never
 * reaches into other modules.
 */
export class NotificationService {
  /** Create a notification for a recipient (called by other modules). */
  static async notify(input: NotifyInput): Promise<NotificationDto> {
    const row = await notificationRepository.create({
      recipient_id: input.recipientId,
      title: input.title,
      body: input.body ?? null,
      type: input.type ?? 'info',
      gym_id: input.gymId ?? null,
      data: input.data ?? {},
    });
    return toNotificationDto(row);
  }

  static async list(recipientId: string, query: ListQuery): Promise<PaginatedResult<NotificationDto>> {
    const result = await notificationRepository.findMany({
      gymId: recipientId, // tenantColumn is `recipient_id` for this repository
      page: query.page,
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      order: query.order,
    });
    return { ...result, items: result.items.map(toNotificationDto) };
  }

  static unreadCount(recipientId: string): Promise<number> {
    return notificationRepository.unreadCount(recipientId);
  }

  static async markRead(recipientId: string, id: string): Promise<NotificationDto> {
    const updated = await notificationRepository.update(
      id,
      { is_read: true, read_at: new Date().toISOString() },
      recipientId,
    );
    if (!updated) throw new NotFoundError('Notification not found', 'NOTIFICATION_NOT_FOUND');
    return toNotificationDto(updated);
  }

  static async markAllRead(recipientId: string): Promise<void> {
    await notificationRepository.markAllRead(recipientId);
  }
}
