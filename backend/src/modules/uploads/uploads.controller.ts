import { Request, Response } from 'express';
import { UploadsService } from '@/modules/uploads/uploads.service';
import { currentUser } from '@/shared/utils';
import { sendCreated } from '@/shared/responses';

export class UploadsController {
  static async createSignedUploadUrl(req: Request, res: Response): Promise<Response> {
    const user = currentUser(req);
    const target = await UploadsService.createSignedUploadUrl(user.id, req.body);
    return sendCreated(res, target, 'Upload URL created');
  }
}
