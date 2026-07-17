import { AttendanceDetailRow, AttendanceDto } from '@/modules/attendance/attendance.types';

export const toAttendanceDto = (row: AttendanceDetailRow): AttendanceDto => ({
  id: row.id,
  gymId: row.gym_id,
  memberId: row.member_id,
  qrCodeId: row.qr_code_id,
  checkedInAt: row.checked_in_at,
  checkedOutAt: row.checked_out_at,
  attendanceDate: row.attendance_date,
  method: row.method,
  status: row.status,
  createdAt: row.created_at,
  member: row.member ? { id: row.member.id, fullName: row.member.full_name } : undefined,
});
