export type NotificationType =
  | 'info'
  | 'payment'
  | 'membership'
  | 'attendance'
  | 'system'
  | 'promotion';

export interface NotificationRow {
  id: string;
  gym_id: string | null;
  recipient_id: string;
  title: string;
  body: string | null;
  type: NotificationType;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationDto {
  id: string;
  gymId: string | null;
  title: string;
  body: string | null;
  type: NotificationType;
  data: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotifyInput {
  recipientId: string;
  title: string;
  body?: string;
  type?: NotificationType;
  gymId?: string | null;
  data?: Record<string, unknown>;
}
