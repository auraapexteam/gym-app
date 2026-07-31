import { Router } from 'express';
import { authRoutes } from '@/modules/auth';
import { gymRoutes } from '@/modules/gym';
import { memberRoutes } from '@/modules/members';
import { planRoutes } from '@/modules/plans';
import { subscriptionRoutes } from '@/modules/subscriptions';
import { paymentRoutes } from '@/modules/payments';
import { attendanceRoutes } from '@/modules/attendance';
import { qrRoutes } from '@/modules/qr';
import { trainerRoutes } from '@/modules/trainers';
import { equipmentRoutes } from '@/modules/equipment';
import { galleryRoutes } from '@/modules/gallery';
import { analyticsRoutes } from '@/modules/analytics';
import { notificationRoutes } from '@/modules/notifications';
import { adminRoutes } from '@/modules/admin';
import { progressRoutes } from '@/modules/progress';
import { uploadsRoutes } from '@/modules/uploads';

/**
 * Aggregated versioned API router. Every feature module contributes its own
 * router here; the module owns its internal middleware pipeline (auth,
 * authorization, validation). Mounted under `/api/v1` by the app.
 */
const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/gyms', gymRoutes);
apiRouter.use('/members', memberRoutes);
apiRouter.use('/plans', planRoutes);
apiRouter.use('/subscriptions', subscriptionRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/qr', qrRoutes);
apiRouter.use('/trainers', trainerRoutes);
apiRouter.use('/equipment', equipmentRoutes);
apiRouter.use('/gallery', galleryRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/progress', progressRoutes);
apiRouter.use('/uploads', uploadsRoutes);

export default apiRouter;
