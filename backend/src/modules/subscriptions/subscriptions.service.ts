import { subscriptionRepository } from '@/modules/subscriptions/subscriptions.repository';
import { toSubscriptionDto } from '@/modules/subscriptions/subscriptions.dto';
import {
  CreateManualSubscriptionInput,
  SubscriptionDto,
} from '@/modules/subscriptions/subscriptions.types';
import { PlanService } from '@/modules/plans';
import { MemberService } from '@/modules/members';
import { ListQuery, PaginatedResult } from '@/shared/types';
import { NotFoundError, BusinessRuleError, ForbiddenError } from '@/shared/errors';
import { Role } from '@/shared/rbac';

/**
 * Subscription (membership) lifecycle. The financial confirmation that
 * *activates* a paid subscription is owned by the payment module (via an atomic
 * DB transaction); this service owns reads, cancellation and manual (cash)
 * membership creation.
 */
export class SubscriptionService {
  static async listForGym(
    gymId: string,
    query: ListQuery,
    filters: { status?: string; memberId?: string } = {},
  ): Promise<PaginatedResult<SubscriptionDto>> {
    const result = await subscriptionRepository.listDetailed({
      gymId,
      page: query.page,
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      order: query.order,
      status: filters.status,
      memberId: filters.memberId,
    });
    return { ...result, items: result.items.map(toSubscriptionDto) };
  }

  static async getById(gymId: string, id: string): Promise<SubscriptionDto> {
    const row = await subscriptionRepository.findDetailedById(id, gymId);
    if (!row) throw new NotFoundError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
    return toSubscriptionDto(row);
  }

  static async getByIdGlobal(id: string): Promise<SubscriptionDto> {
    const row = await subscriptionRepository.findDetailedById(id);
    if (!row) throw new NotFoundError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
    return toSubscriptionDto(row);
  }

  /** All subscriptions for a customer (across every gym they are a member of). */
  static async listForProfile(profileId: string): Promise<SubscriptionDto[]> {
    const memberIds = await MemberService.listMemberIdsForProfile(profileId);
    const rows = await subscriptionRepository.findByMemberIds(memberIds);
    return rows.map(toSubscriptionDto);
  }

  /**
   * Whether a member currently holds an active, non-expired membership. This is
   * the question the attendance module asks — never "has payment succeeded?".
   */
  static async hasActiveMembership(gymId: string, memberId: string): Promise<boolean> {
    const active = await subscriptionRepository.findActiveForMember(gymId, memberId);
    return active !== null;
  }

  /**
   * Cancel a subscription. Allows self-service cancellation by customer who owns the
   * subscription, or gym staff/owner with management permissions.
   */
  static async cancel(
    idOrGymId: string,
    idOrActor?: string | { id: string; role: Role; gymId?: string | null },
  ): Promise<SubscriptionDto> {
    // Handle overload: cancel(gymId, id) vs cancel(id, actor)
    let id: string;
    let actor: { id: string; role: Role; gymId?: string | null } | string | undefined;

    if (typeof idOrActor === 'string') {
      id = idOrActor;
      actor = idOrGymId;
    } else {
      id = idOrGymId;
      actor = idOrActor;
    }

    const existing = await subscriptionRepository.findDetailedById(id);
    if (!existing) throw new NotFoundError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND');

    if (actor && typeof actor === 'object') {
      const isSuperAdmin = actor.role === Role.SUPER_ADMIN;
      const isGymStaff = (actor.role === Role.OWNER || actor.role === Role.STAFF) && actor.gymId === existing.gym_id;
      const isCustomerOwner = existing.member?.profile_id === actor.id;

      if (!isSuperAdmin && !isGymStaff && !isCustomerOwner) {
        throw new ForbiddenError('You are not authorized to cancel this subscription', 'FORBIDDEN');
      }
    } else if (typeof actor === 'string') {
      // Legacy gymId match check
      if (existing.gym_id !== actor) {
        throw new NotFoundError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
      }
    }

    if (existing.status === 'cancelled') {
      throw new BusinessRuleError('Subscription is already cancelled', 'ALREADY_CANCELLED');
    }

    await subscriptionRepository.update(
      id,
      { status: 'cancelled', cancelled_at: new Date().toISOString() },
      existing.gym_id,
    );
    return this.getById(existing.gym_id, id);
  }

  /** Create an immediately-active membership recorded against a cash/manual payment. */
  static async createManual(
    gymId: string,
    input: CreateManualSubscriptionInput,
  ): Promise<SubscriptionDto> {
    // Verifies the member exists in this gym (throws 404 otherwise).
    await MemberService.getById(gymId, input.memberId);

    const plan = await PlanService.getActiveRow(gymId, input.planId);

    const { subscription_id } = await subscriptionRepository.createManualMembership({
      gymId,
      memberId: input.memberId,
      planId: input.planId,
      amount: Number(plan.price),
      durationDays: plan.duration_days,
      method: input.method ?? 'cash',
    });

    // Automatically promote member status to active upon plan creation
    await MemberService.update(gymId, input.memberId, { status: 'active' }).catch(() => null);

    return this.getById(gymId, subscription_id);
  }
}
