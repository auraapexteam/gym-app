import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscription';

export class PlanController {
  static async listPlans(req: Request, res: Response) {
    try {
      const plans = await SubscriptionService.getPlans();
      return res.status(200).json({
        success: true,
        data: plans,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch plans',
      });
    }
  }
}
