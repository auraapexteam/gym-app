export type UploadPurpose = 'avatar' | 'progress-photo';

export interface CreateSignedUploadUrlInput {
  fileName: string;
  mimeType: string;
  size: number;
  purpose: UploadPurpose;
}

export interface SignedUploadUrlDto {
  uploadUrl: string;
  token: string;
  bucket: string;
  path: string;
}
