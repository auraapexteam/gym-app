import { Request, Response } from 'express';
import { PaymentService } from '@/modules/payments/payments.service';
import { AuditService } from '@/shared/services';
import { currentUser, requireGymId, parseListQuery, buildPaginationMeta, clientIp } from '@/shared/utils';
import { sendSuccess, sendCreated, sendPaginated } from '@/shared/responses';

export class PaymentController {
  /** Initiate a checkout: returns Razorpay order parameters. */
  static async createOrder(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const checkout = await PaymentService.createOrder(user, req.body);
    return sendCreated(res, checkout, 'Order created');
  }

  /** Verify a completed checkout and confirm the payment. */
  static async verify(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const result = await PaymentService.verify(req.body);

    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      gymId: user.gymId,
      action: 'payment.verified',
      resourceType: 'payment',
      resourceId: result.paymentId,
      ipAddress: clientIp(req),
    });

    return sendSuccess(res, result, 'Payment verified');
  }

  static async list(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const query = parseListQuery(req.query);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const memberId = typeof req.query.memberId === 'string' ? req.query.memberId : undefined;

    const { items, total } = await PaymentService.list(gymId, query, { status, memberId });
    return sendPaginated(res, items, buildPaginationMeta(total, query.page, query.limit));
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const payment = await PaymentService.getById(gymId, req.params.id);
    return sendSuccess(res, payment, 'Payment fetched successfully');
  }

  static async refund(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const gymId = requireGymId(user);
    const payment = await PaymentService.refund(gymId, req.params.id);

    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      gymId,
      action: 'payment.refunded',
      resourceType: 'payment',
      resourceId: payment.id,
      ipAddress: clientIp(req),
    });

    return sendSuccess(res, payment, 'Payment refunded');
  }
}
