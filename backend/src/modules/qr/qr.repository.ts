import { BaseRepository } from '@/shared/repositories';
import { QrRow } from '@/modules/qr/qr.types';

const QR_COLUMNS =
  'id, gym_id, token, status, label, created_by, rotated_from, revoked_at, created_at, updated_at';

export class QrRepository extends BaseRepository<QrRow> {
  constructor() {
    super('qr_codes', { softDelete: false, defaultSelect: QR_COLUMNS });
  }

  /** The current active QR for a gym, if any. */
  async findActiveByGym(gymId: string): Promise<QrRow | null> {
    const { data, error } = await this.client
      .from('qr_codes')
      .select(QR_COLUMNS)
      .eq('gym_id', gymId)
      .eq('status', 'active')
      .maybeSingle();
    if (error) this.fail('Failed to load active QR', error);
    return (data as QrRow) ?? null;
  }

  /** Resolve a QR by its opaque token (used for server-side validation). */
  findByToken(token: string): Promise<QrRow | null> {
    return this.findOneBy('token', token);
  }

  /** Atomically rotate the gym QR and return the new code's id. */
  async rotate(gymId: string, token: string, createdBy: string, label: string | null): Promise<string> {
    const { data, error } = await this.client.rpc('rotate_gym_qr', {
      p_gym_id: gymId,
      p_token: token,
      p_created_by: createdBy,
      p_label: label,
    });
    if (error) this.fail('Failed to rotate QR', error);
    return data as string;
  }
}

export const qrRepository = new QrRepository();
