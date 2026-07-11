import { Router } from 'express';
import { PlanController } from '../controllers/plan';

const router = Router();

router.get('/', PlanController.listPlans);

export default router;
