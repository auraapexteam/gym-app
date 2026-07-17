import { attendanceRepository } from '@/modules/attendance/attendance.repository';
import { toAttendanceDto } from '@/modules/attendance/attendance.dto';
import { STATS_WINDOW_DAYS } from '@/modules/attendance/attendance.constants';
import {
  AttendanceDto,
  AttendanceMethod,
  AttendanceStats,
} from '@/modules/attendance/attendance.types';
import { QrService } from '@/modules/qr';
import { MemberService } from '@/modules/members';
import { SubscriptionService } from '@/modules/subscriptions';
import { ListQuery, PaginatedResult, UserContext } from '@/shared/types';
import { BusinessRuleError, ConflictError } from '@/shared/errors';
import { todayUtc, daysAgoUtc } from '@/shared/utils';

/**
 * Attendance tracking. Every check-in is validated server-side: valid QR,
 * membership in the gym, an ACTIVE membership, and no duplicate for the day.
 * Attendance is never created directly from the database or trusted from the
 * client.
 */
export class AttendanceService {
  /** Customer scans a gym QR to check in. */
  static async checkInViaQr(user: UserContext, token: string): Promise<AttendanceDto> {
    const qr = await QrService.validateToken(token);
    const gymId = qr.gym_id;

    const member = await MemberService.findForProfile(gymId, user.id);
    if (!member) {
      throw new BusinessRuleError('You are not a member of this gym', 'NOT_A_MEMBER');
    }

    return this.record(gymId, member.id, 'qr', qr.id);
  }

  /** Staff records a member's attendance manually (e.g. at reception). */
  static async manualCheckIn(gymId: string, memberId: string): Promise<AttendanceDto> {
    await MemberService.getById(gymId, memberId); // throws 404 if not in this gym
    return this.record(gymId, memberId, 'manual', null);
  }

  /** Customer's own attendance history across every gym they belong to. */
  static async historyForProfile(profileId: string): Promise<AttendanceDto[]> {
    const memberIds = await MemberService.listMemberIdsForProfile(profileId);
    const rows = await attendanceRepository.findByMemberIds(memberIds);
    return rows.map(toAttendanceDto);
  }

  static async listForGym(
    gymId: string,
    query: ListQuery,
    filters: { memberId?: string; dateFrom?: string; dateTo?: string } = {},
  ): Promise<PaginatedResult<AttendanceDto>> {
    const result = await attendanceRepository.listDetailed({
      gymId,
      page: query.page,
      limit: query.limit,
      offset: query.offset,
      sort: query.sort === 'created_at' ? 'checked_in_at' : query.sort,
      order: query.order,
      memberId: filters.memberId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    });
    return { ...result, items: result.items.map(toAttendanceDto) };
  }

  static async stats(gymId: string): Promise<AttendanceStats> {
    const [today, last7Days, last30Days] = await Promise.all([
      attendanceRepository.countSince(gymId, todayUtc()),
      attendanceRepository.countSince(gymId, daysAgoUtc(STATS_WINDOW_DAYS.WEEK)),
      attendanceRepository.countSince(gymId, daysAgoUtc(STATS_WINDOW_DAYS.MONTH)),
    ]);
    return { today, last7Days, last30Days };
  }

  /** Shared check-in path: membership + duplicate validation, then record. */
  private static async record(
    gymId: string,
    memberId: string,
    method: AttendanceMethod,
    qrCodeId: string | null,
  ): Promise<AttendanceDto> {
    const active = await SubscriptionService.hasActiveMembership(gymId, memberId);
    if (!active) {
      throw new BusinessRuleError('Membership is not active', 'MEMBERSHIP_INACTIVE');
    }

    const date = todayUtc();
    const duplicate = await attendanceRepository.findByMemberAndDate(gymId, memberId, date);
    if (duplicate) {
      throw new ConflictError('Already checked in today', 'ALREADY_CHECKED_IN');
    }

    const row = await attendanceRepository.create({
      gym_id: gymId,
      member_id: memberId,
      qr_code_id: qrCodeId,
      method,
      status: 'success',
      attendance_date: date,
    });

    return toAttendanceDto(row);
  }
}
