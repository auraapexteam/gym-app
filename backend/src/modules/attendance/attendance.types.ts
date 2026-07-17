export type AttendanceMethod = 'qr' | 'manual';
export type AttendanceStatus = 'success' | 'failed';

export interface AttendanceRow {
  id: string;
  gym_id: string;
  member_id: string;
  qr_code_id: string | null;
  checked_in_at: string;
  checked_out_at: string | null;
  attendance_date: string;
  method: AttendanceMethod;
  status: AttendanceStatus;
  created_at: string;
}

export interface AttendanceDetailRow extends AttendanceRow {
  member?: { id: string; full_name: string } | null;
}

export interface AttendanceDto {
  id: string;
  gymId: string;
  memberId: string;
  qrCodeId: string | null;
  checkedInAt: string;
  checkedOutAt: string | null;
  attendanceDate: string;
  method: AttendanceMethod;
  status: AttendanceStatus;
  createdAt: string;
  member?: { id: string; fullName: string } | null;
}

export interface CheckInInput {
  token: string;
}

export interface ManualCheckInInput {
  memberId: string;
}

export interface AttendanceStats {
  today: number;
  last7Days: number;
  last30Days: number;
}
