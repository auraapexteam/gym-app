import { BaseRepository } from '@/shared/repositories';
import { PaginatedResult } from '@/shared/types';
import { AttendanceRow, AttendanceDetailRow } from '@/modules/attendance/attendance.types';

const BASE_COLUMNS =
  'id, gym_id, member_id, qr_code_id, checked_in_at, checked_out_at, attendance_date, method, status, created_at';

const DETAIL_SELECT = `${BASE_COLUMNS}, member:members(id, full_name)`;

export interface ListAttendanceParams {
  gymId: string;
  page: number;
  limit: number;
  offset: number;
  sort: string;
  order: 'asc' | 'desc';
  memberId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export class AttendanceRepository extends BaseRepository<AttendanceRow> {
  constructor() {
    super('attendances', { softDelete: false, defaultSelect: BASE_COLUMNS });
  }

  /** The member's check-in for a specific day, if it exists (duplicate guard). */
  findByMemberAndDate(gymId: string, memberId: string, date: string): Promise<AttendanceRow | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.client.from('attendances') as any)
      .select(BASE_COLUMNS)
      .eq('gym_id', gymId)
      .eq('member_id', memberId)
      .eq('attendance_date', date)
      .maybeSingle()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data, error }: { data: any; error: unknown }) => {
        if (error) this.fail('Failed to check attendance', error);
        return (data as AttendanceRow) ?? null;
      });
  }

  async listDetailed(params: ListAttendanceParams): Promise<PaginatedResult<AttendanceDetailRow>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.client
      .from('attendances')
      .select(DETAIL_SELECT, { count: 'exact' })
      .eq('gym_id', params.gymId);

    if (params.memberId) query = query.eq('member_id', params.memberId);
    if (params.dateFrom) query = query.gte('attendance_date', params.dateFrom);
    if (params.dateTo) query = query.lte('attendance_date', params.dateTo);

    query = query
      .order(params.sort, { ascending: params.order === 'asc' })
      .range(params.offset, params.offset + params.limit - 1);

    const { data, error, count } = await query;
    if (error) this.fail('Failed to list attendance', error);
    return {
      items: (data as AttendanceDetailRow[]) ?? [],
      total: count ?? 0,
      page: params.page,
      limit: params.limit,
    };
  }

  async findByMemberIds(memberIds: string[]): Promise<AttendanceDetailRow[]> {
    if (memberIds.length === 0) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.client.from('attendances') as any)
      .select(DETAIL_SELECT)
      .in('member_id', memberIds)
      .order('checked_in_at', { ascending: false })
      .limit(100);
    if (error) this.fail('Failed to load attendance history', error);
    return (data as AttendanceDetailRow[]) ?? [];
  }

  /** Count successful check-ins on or after `sinceDate` for a gym. */
  async countSince(gymId: string, sinceDate: string): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error } = await (this.client.from('attendances') as any)
      .select('id', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .eq('status', 'success')
      .gte('attendance_date', sinceDate);
    if (error) this.fail('Failed to count attendance', error);
    return count ?? 0;
  }
}

export const attendanceRepository = new AttendanceRepository();
