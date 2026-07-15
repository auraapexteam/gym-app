export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export interface SubscriptionRow {
  id: string;
  gym_id: string;
  member_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  start_date: string | null;
  end_date: string | null;
  auto_renew: boolean;
  razorpay_subscription_id: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Row shape when plan/member relations are embedded via the read query. */
export interface SubscriptionDetailRow extends SubscriptionRow {
  plan: { id: string; name: string; price: number; duration_days: number } | null;
  member: { id: string; full_name: string; email: string | null; phone: string | null } | null;
}

export interface SubscriptionDto {
  id: string;
  gymId: string;
  memberId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string | null;
  endDate: string | null;
  autoRenew: boolean;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  plan: { id: string; name: string; price: number; durationDays: number } | null;
  member: { id: string; fullName: string; email: string | null; phone: string | null } | null;
}

export interface CreateManualSubscriptionInput {
  memberId: string;
  planId: string;
  method?: 'cash' | 'card' | 'upi' | 'netbanking' | 'wallet' | 'other';
}
