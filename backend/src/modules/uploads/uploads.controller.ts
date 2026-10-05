import { Request, Response } from 'express';
import { UploadsService } from '@/modules/uploads/uploads.service';
import { currentUser } from '@/shared/utils';
import { sendCreated, sendSuccess } from '@/shared/responses';
import { PrivateMediaService } from '@/shared/services';

export class UploadsController {
  static async signedRead(req: Request, res: Response): Promise<Response> {
    const url = await PrivateMediaService.signedReadUrl(currentUser(req).id, req.body.path);
    res.setHeader('Cache-Control', 'private, no-store');
    return sendSuccess(res, { url, expiresIn: PrivateMediaService.expiresIn }, 'Private file access prepared');
  }
  static async createSignedUploadUrl(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const target = await UploadsService.createSignedUploadUrl(user.id, req.body);
    res.setHeader('Cache-Control', 'private, no-store');
    return sendCreated(res, target, 'Upload URL created');
  }
}
