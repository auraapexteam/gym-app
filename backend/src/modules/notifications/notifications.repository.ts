import { BaseRepository } from '@/shared/repositories';
import { NotificationRow } from '@/modules/notifications/notifications.types';

const NOTIFICATION_COLUMNS =
  'id, gym_id, recipient_id, title, body, type, data, is_read, read_at, created_at';

/** Notifications are scoped to their recipient rather than a gym. */
export class NotificationRepository extends BaseRepository<NotificationRow> {
  constructor() {
    super('notifications', {
      softDelete: false,
      defaultSelect: NOTIFICATION_COLUMNS,
      tenantColumn: 'recipient_id',
    });
  }

  async unreadCount(recipientId: string): Promise<number> {
    return this.count(recipientId, { is_read: false });
  }

  async markAllRead(recipientId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (this.client.from('notifications') as any)
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', recipientId)
      .eq('is_read', false);
    if (error) this.fail('Failed to mark notifications read', error);
  }
}

export const notificationRepository = new NotificationRepository();
