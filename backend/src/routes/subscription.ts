import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription';
import { requireAuth } from '../middlewares/auth';

const router = Router();

// Secure routes requiring JWT validation
router.post('/', requireAuth as any, SubscriptionController.createSubscription as any);
router.get('/me', requireAuth as any, SubscriptionController.getCurrentSubscription as any);

export default router;
