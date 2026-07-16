import { QrRow, QrDto } from '@/modules/qr/qr.types';

export const toQrDto = (row: QrRow): QrDto => ({
  id: row.id,
  gymId: row.gym_id,
  token: row.token,
  // Clients scan this value; the attendance endpoint resolves it server-side.
  qrValue: row.token,
  status: row.status,
  label: row.label,
  createdAt: row.created_at,
  revokedAt: row.revoked_at,
});
