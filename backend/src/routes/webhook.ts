import { Router } from 'express';
import { WebhookController } from '../controllers/webhook';

const router = Router();

router.post('/', WebhookController.handleRazorpayWebhook);

export default router;
