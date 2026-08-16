import { SubscriptionDetailRow, SubscriptionDto } from '@/modules/subscriptions/subscriptions.types';

export const toSubscriptionDto = (row: SubscriptionDetailRow): SubscriptionDto => ({
  id: row.id,
  gymId: row.gym_id,
  memberId: row.member_id,
  planId: row.plan_id,
  status: row.status,
  startDate: row.start_date,
  endDate: row.end_date,
  autoRenew: row.auto_renew,
  cancelledAt: row.cancelled_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  plan: row.plan
    ? {
        id: row.plan.id,
        name: row.plan.name,
        price: Number(row.plan.price),
        durationDays: row.plan.duration_days,
      }
    : null,
  member: row.member
    ? {
        id: row.member.id,
        profileId: row.member.profile_id ?? null,
        fullName: row.member.full_name,
        email: row.member.email,
        phone: row.member.phone,
      }
    : null,
});
