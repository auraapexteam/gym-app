import { z } from 'zod';
import { idParamSchema, listQuerySchema } from '@/shared/validators';

export const listNotificationsSchema = listQuerySchema;
export const notificationIdSchema = idParamSchema;
