export type QrStatus = 'active' | 'revoked';

export interface QrRow {
  id: string;
  gym_id: string;
  token: string;
  status: QrStatus;
  label: string | null;
  created_by: string | null;
  rotated_from: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QrDto {
  id: string;
  gymId: string;
  token: string;
  /** The exact string a client should encode into the printed QR image. */
  qrValue: string;
  status: QrStatus;
  label: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface GenerateQrInput {
  label?: string;
}
