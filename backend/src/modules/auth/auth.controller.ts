import { Request, Response } from 'express';
import { AuthService } from '@/modules/auth/auth.service';
import { AuditService } from '@/shared/services';
import { currentUser, clientIp } from '@/shared/utils';
import { sendSuccess, sendCreated } from '@/shared/responses';

export class AuthController {
  static async register(req: Request, res: Response): Promise<Response> {
    const result = await AuthService.register(req.body);
    await AuditService.record({
      actorId: result.profile.id,
      actorRole: result.profile.role,
      action: 'auth.register',
      resourceType: 'profile',
      resourceId: result.profile.id,
      ipAddress: clientIp(req),
    });
    return sendCreated(res, result, 'Registration successful');
  }

  static async login(req: Request, res: Response): Promise<Response> {
    const result = await AuthService.login(req.body);
    await AuditService.record({
      actorId: result.profile.id,
      actorRole: result.profile.role,
      gymId: result.profile.gymId,
      action: 'auth.login',
      resourceType: 'profile',
      resourceId: result.profile.id,
      ipAddress: clientIp(req),
    });
    return sendSuccess(res, result, 'Login successful');
  }

  static async logout(req: Request, res: Response): Promise<Response> {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
    if (token) await AuthService.logout(token);
    return sendSuccess(res, null, 'Logged out successfully');
  }

  static async forgotPassword(req: Request, res: Response): Promise<Response> {
    await AuthService.forgotPassword(req.body.email);
    return sendSuccess(res, null, 'If the email exists, a reset link has been sent');
  }

  static async resetPassword(req: Request, res: Response): Promise<Response> {
    await AuthService.resetPassword(req.body.accessToken, req.body.password);
    return sendSuccess(res, null, 'Password reset successfully');
  }

  static async me(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const profile = await AuthService.getProfile(user.id);
    return sendSuccess(res, profile, 'Profile fetched successfully');
  }

  static async updateMe(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const profile = await AuthService.updateProfile(user.id, req.body);
    return sendSuccess(res, profile, 'Profile updated successfully');
  }

  static async phoneOtp(req: Request, res: Response): Promise<Response> {
    const result = await AuthService.sendPhoneOtp(req.body.phone);
    return sendSuccess(res, null, result.message);
  }

  static async verifyOtp(req: Request, res: Response): Promise<Response> {
    const result = await AuthService.verifyPhoneOtp(req.body.phone, req.body.code);
    await AuditService.record({
      actorId: result.profile.id,
      actorRole: result.profile.role,
      gymId: result.profile.gymId,
      action: 'auth.verify_otp',
      resourceType: 'profile',
      resourceId: result.profile.id,
      ipAddress: clientIp(req),
    });
    return sendSuccess(res, result, 'Phone verification successful');
  }

  static async deleteAccount(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    await AuthService.deleteAccount(user.id);
    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      gymId: user.gymId,
      action: 'auth.delete_account',
      resourceType: 'profile',
      resourceId: user.id,
      ipAddress: clientIp(req),
    });
    return sendSuccess(res, null, 'Account deleted successfully');
  }
}

