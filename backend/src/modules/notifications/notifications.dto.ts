import { NotificationRow, NotificationDto } from '@/modules/notifications/notifications.types';

export const toNotificationDto = (row: NotificationRow): NotificationDto => ({
  id: row.id,
  gymId: row.gym_id,
  title: row.title,
  body: row.body,
  type: row.type,
  data: row.data ?? {},
  isRead: row.is_read,
  readAt: row.read_at,
  createdAt: row.created_at,
});
