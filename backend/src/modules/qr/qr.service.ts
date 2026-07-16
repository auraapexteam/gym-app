import { qrRepository } from '@/modules/qr/qr.repository';
import { toQrDto } from '@/modules/qr/qr.dto';
import { QrDto, QrRow, GenerateQrInput } from '@/modules/qr/qr.types';
import { ListQuery, PaginatedResult } from '@/shared/types';
import { NotFoundError, ForbiddenError, BusinessRuleError } from '@/shared/errors';
import { generateOpaqueToken } from '@/shared/utils';

/**
 * QR lifecycle for a gym: generate, rotate, revoke and validate. This module
 * owns QR codes only — it never records attendance (the attendance module does).
 */
export class QrService {
  static async getActive(gymId: string): Promise<QrDto> {
    const row = await qrRepository.findActiveByGym(gymId);
    if (!row) throw new NotFoundError('No active QR code', 'QR_NOT_FOUND');
    return toQrDto(row);
  }

  static async list(gymId: string, query: ListQuery): Promise<PaginatedResult<QrDto>> {
    const result = await qrRepository.findMany({
      gymId,
      page: query.page,
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      order: query.order,
    });
    return { ...result, items: result.items.map(toQrDto) };
  }

  /** Generate a new QR, atomically revoking the previous active code. */
  static async generate(gymId: string, createdBy: string, input: GenerateQrInput): Promise<QrDto> {
    const token = generateOpaqueToken(24);
    const id = await qrRepository.rotate(gymId, token, createdBy, input.label ?? null);
    const row = await qrRepository.findById(id, gymId);
    if (!row) throw new NotFoundError('QR code not found', 'QR_NOT_FOUND');
    return toQrDto(row);
  }

  static async revoke(gymId: string, id: string): Promise<QrDto> {
    const existing = await qrRepository.findById(id, gymId);
    if (!existing) throw new NotFoundError('QR code not found', 'QR_NOT_FOUND');
    if (existing.status === 'revoked') {
      throw new BusinessRuleError('QR code is already revoked', 'QR_ALREADY_REVOKED');
    }
    const updated = await qrRepository.update(
      id,
      { status: 'revoked', revoked_at: new Date().toISOString() },
      gymId,
    );
    return toQrDto(updated as QrRow);
  }

  /**
   * Validate a scanned token and return the owning QR row. Throws when the token
   * is unknown or revoked. Consumed by the attendance module.
   */
  static async validateToken(token: string): Promise<QrRow> {
    const row = await qrRepository.findByToken(token);
    if (!row || row.status !== 'active') {
      throw new ForbiddenError('Invalid or expired QR code', 'INVALID_QR');
    }
    return row;
  }
}
