import { Request, Response } from 'express';
import { GymService } from '@/modules/gym/gym.service';
import { AuditService } from '@/shared/services';
import { currentUser, requireGymId, clientIp, parseListQuery, buildPaginationMeta } from '@/shared/utils';
import { sendSuccess, sendPaginated } from '@/shared/responses';

export class GymController {
  /** Fetch the authenticated user's own gym. */
  static async getMine(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const gym = await GymService.getById(gymId);
    return sendSuccess(res, gym, 'Gym fetched successfully');
  }

  /** Update the authenticated user's own gym. */
  static async updateMine(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const gymId = requireGymId(user);
    const gym = await GymService.update(gymId, req.body);

    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      gymId,
      action: 'gym.updated',
      resourceType: 'gym',
      resourceId: gymId,
      ipAddress: clientIp(req),
    });

    return sendSuccess(res, gym, 'Gym updated successfully');
  }

  /** Public gym profile (customer-facing). */
  static async getPublic(req: Request, res: Response): Promise<Response> {
    const gym = await GymService.getPublicById(req.params.id);
    return sendSuccess(res, gym, 'Gym fetched successfully');
  }

  /** List all staff belonging to the gym. */
  static async listStaff(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const staffList = await GymService.listStaff(gymId);
    return sendSuccess(res, staffList, 'Staff list fetched successfully');
  }

  /** Onboard a new staff member (creates user credentials + staff row). */
  static async createStaff(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const gymId = requireGymId(user);
    const staff = await GymService.createStaff(gymId, req.body);

    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      gymId,
      action: 'staff.created',
      resourceType: 'gym_staff',
      resourceId: staff.id,
      ipAddress: clientIp(req),
    });

    return sendSuccess(res, staff, 'Staff member onboarded successfully', 201);
  }

  /** Delete a staff member. */
  static async deleteStaff(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const gymId = requireGymId(user);
    const { id } = req.params;

    await GymService.deleteStaff(gymId, id);

    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      gymId,
      action: 'staff.deleted',
      resourceType: 'gym_staff',
      resourceId: id,
      ipAddress: clientIp(req),
    });

    return sendSuccess(res, null, 'Staff member deleted successfully');
  }

  /** Customer directory of gyms. */
  static async listPublicDirectory(req: Request, res: Response): Promise<Response> {
    const query = parseListQuery(req.query);
    const { items, total } = await GymService.listPublicDirectory(query);
    return sendPaginated(res, items, buildPaginationMeta(total, query.page, query.limit));
  }

  /** Submit request to link profile to gym. */
  static async createJoinRequest(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const { gymId } = req.body;
    const request = await GymService.createJoinRequest(user.id, gymId);

    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      gymId,
      action: 'gym_join_request.created',
      resourceType: 'gym_join_requests',
      resourceId: request.id,
      ipAddress: clientIp(req),
    });

    return sendSuccess(res, request, 'Link request submitted successfully', 201);
  }

  /** Get link status of authenticated customer. */
  static async getJoinRequestStatus(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const status = await GymService.getJoinRequestStatus(user.id);
    return sendSuccess(res, status, 'Join request status fetched successfully');
  }

  /** List pending join requests for the gym. */
  static async listPendingJoinRequests(req: Request, res: Response): Promise<Response> {
    const gymId = requireGymId(currentUser(req));
    const requests = await GymService.listPendingJoinRequests(gymId);
    return sendSuccess(res, requests, 'Pending join requests fetched successfully');
  }

  /** Approve a pending join request. */
  static async approveJoinRequest(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const gymId = requireGymId(user);
    const { id } = req.params;

    await GymService.approveJoinRequest(gymId, id);

    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      gymId,
      action: 'gym_join_request.approved',
      resourceType: 'gym_join_requests',
      resourceId: id,
      ipAddress: clientIp(req),
    });

    return sendSuccess(res, null, 'Join request approved successfully');
  }

  /** Reject a pending join request. */
  static async rejectJoinRequest(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const gymId = requireGymId(user);
    const { id } = req.params;

    await GymService.rejectJoinRequest(gymId, id);

    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      gymId,
      action: 'gym_join_request.rejected',
      resourceType: 'gym_join_requests',
      resourceId: id,
      ipAddress: clientIp(req),
    });

    return sendSuccess(res, null, 'Join request rejected successfully');
  }
}

