import { gymRepository } from '@/modules/gym/gym.repository';
import { toGymDto, toPublicGymDto } from '@/modules/gym/gym.dto';
import {
  CreateGymInput,
  GymDto,
  GymRow,
  GymStatus,
  PublicGymDto,
  UpdateGymInput,
} from '@/modules/gym/gym.types';
import { ListQuery, PaginatedResult } from '@/shared/types';
import { NotFoundError, BadRequestError, ConflictError } from '@/shared/errors';
import { supabase } from '@/config/supabase';
import { AuthService } from '@/modules/auth/auth.service';
import { Role } from '@/shared/rbac/roles';
import { NotificationService } from '@/modules/notifications';


/** Business logic for the gym (tenant) profile, timings and settings. */
export class GymService {
  static async getById(id: string): Promise<GymDto> {
    return toGymDto(await this.getRowOrThrow(id));
  }

  static async getPublicById(id: string): Promise<PublicGymDto> {
    return toPublicGymDto(await this.getRowOrThrow(id));
  }

  static async update(id: string, input: UpdateGymInput): Promise<GymDto> {
    await this.getRowOrThrow(id);

    const patch: Partial<GymRow> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.email !== undefined) patch.email = input.email;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.address !== undefined) patch.address = input.address;
    if (input.description !== undefined) patch.description = input.description;
    if (input.logoUrl !== undefined) patch.logo_url = input.logoUrl;
    if (input.timings !== undefined) patch.timings = input.timings;
    if (input.weeklyOff !== undefined) patch.weekly_off = input.weeklyOff;
    if (input.settings !== undefined) patch.settings = input.settings;

    const updated = await gymRepository.update(id, patch);
    if (!updated) throw new NotFoundError('Gym not found', 'GYM_NOT_FOUND');
    return toGymDto(updated);
  }

  // --- Platform-admin operations (used by the admin module) -----------------

  /** Provision a new gym (super-admin onboarding). */
  static async createGym(input: CreateGymInput): Promise<GymDto> {
    const row = await gymRepository.create({
      name: input.name,
      slug: input.slug ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      description: input.description ?? null,
      status: input.status ?? 'active',
    });
    return toGymDto(row);
  }

  /** List every gym on the platform (super admin only). */
  static async listAll(query: ListQuery, status?: string): Promise<PaginatedResult<GymDto>> {
    const result = await gymRepository.findMany({
      page: query.page,
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      order: query.order,
      search: query.search,
      searchColumns: ['name', 'email', 'slug'],
      filters: status ? { status } : undefined,
    });
    return { ...result, items: result.items.map(toGymDto) };
  }

  /** Change a gym's lifecycle status (approve / suspend / activate). */
  static async setStatus(id: string, status: GymStatus): Promise<GymDto> {
    await this.getRowOrThrow(id);
    const updated = await gymRepository.update(id, { status });
    if (!updated) throw new NotFoundError('Gym not found', 'GYM_NOT_FOUND');
    return toGymDto(updated);
  }

  /** Assign an owner profile to a gym. */
  static async assignOwner(gymId: string, ownerId: string): Promise<void> {
    await gymRepository.update(gymId, { owner_id: ownerId });
  }

  private static async getRowOrThrow(id: string): Promise<GymRow> {
    const row = await gymRepository.findById(id);
    if (!row) throw new NotFoundError('Gym not found', 'GYM_NOT_FOUND');
    return row;
  }

  // --- Staff Management Operations -----------------------------------------

  /** List all staff members assigned to the gym. */
  static async listStaff(gymId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('gym_staff')
      .select('id, role, permissions, status, created_at, profiles(id, email, full_name, avatar_url)')
      .eq('gym_id', gymId);

    if (error) {
      throw new BadRequestError(error.message, 'STAFF_LIST_FAILED');
    }
    return data ?? [];
  }

  /** Onboard a new staff member (creates authentication user + gym_staff row). */
  static async createStaff(
    gymId: string,
    input: { email: string; password: string; fullName: string; permissions?: string[] },
  ): Promise<any> {
    // 1. Create the user in Supabase Auth via Admin client
    const profile = await AuthService.createManagedUser({
      email: input.email,
      password: input.password,
      fullName: input.fullName,
      role: Role.STAFF,
      gymId,
    });

    // 2. Create the gym_staff entry mapping the profile
    const { data, error } = await supabase
      .from('gym_staff')
      .insert({
        gym_id: gymId,
        profile_id: profile.id,
        role: Role.STAFF,
        permissions: input.permissions ?? [],
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      // Clean up the created auth user on failure
      await supabase.auth.admin.deleteUser(profile.id);
      throw new BadRequestError(error.message, 'STAFF_CREATE_FAILED');
    }

    return { ...data, profile };
  }

  /** Delete a staff member (deletes the auth user, which cascades to profile & staff). */
  static async deleteStaff(gymId: string, staffId: string): Promise<void> {
    const { data: staff, error: fetchErr } = await supabase
      .from('gym_staff')
      .select('id, profile_id')
      .eq('id', staffId)
      .eq('gym_id', gymId)
      .maybeSingle();

    if (fetchErr || !staff) {
      throw new NotFoundError('Staff member not found', 'STAFF_NOT_FOUND');
    }

    // Deleting the auth user cascades and deletes the profile and gym_staff rows.
    const { error: deleteUserErr } = await supabase.auth.admin.deleteUser(staff.profile_id);
    if (deleteUserErr) {
      throw new BadRequestError(deleteUserErr.message, 'STAFF_DELETE_FAILED');
    }
  }

  /** List all active gyms for the customer directory. */
  static async listPublicDirectory(query: ListQuery): Promise<PaginatedResult<PublicGymDto>> {
    const result = await gymRepository.findMany({
      page: query.page,
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      order: query.order,
      search: query.search,
      searchColumns: ['name', 'email', 'slug', 'address'],
      filters: { status: 'active' },
    });
    return { ...result, items: result.items.map(toPublicGymDto) };
  }

  /** Submit a link request from a customer profile. */
  static async createJoinRequest(profileId: string, gymId: string): Promise<any> {
    const gym = await this.getRowOrThrow(gymId);

    const { data: existing, error: checkErr } = await supabase
      .from('gym_join_requests')
      .select('id, status')
      .eq('gym_id', gymId)
      .eq('profile_id', profileId)
      .maybeSingle();

    if (existing) {
      throw new ConflictError(
        existing.status === 'approved' 
          ? 'You are already linked to this gym' 
          : 'A link request is already pending approval',
        'LINK_REQUEST_EXISTS'
      );
    }

    const { data: request, error: insertErr } = await supabase
      .from('gym_join_requests')
      .insert({ gym_id: gymId, profile_id: profileId, status: 'pending' })
      .select()
      .single();

    if (insertErr) {
      throw new BadRequestError(insertErr.message, 'LINK_REQUEST_FAILED');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', profileId)
      .maybeSingle();

    if (gym.owner_id) {
      await NotificationService.notify({
        recipientId: gym.owner_id,
        title: 'New Gym Join Request',
        body: `${profile?.full_name || 'A customer'} has requested to link to your gym.`,
        type: 'info',
        gymId,
        data: { requestId: request.id, profileId }
      }).catch(err => {
        console.error('Failed to notify owner:', err);
      });
    }

    return request;
  }

  /** Get link request status for a customer. */
  static async getJoinRequestStatus(profileId: string): Promise<any> {
    const { data, error } = await supabase
      .from('gym_join_requests')
      .select('id, gym_id, status, created_at, gyms!gym_join_requests_gym_id_fkey(name, logo_url)')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) {
      throw new BadRequestError(error.message, 'JOIN_REQUEST_STATUS_FAILED');
    }
    return data;
  }

  /** List pending join requests for a gym owner. */
  static async listPendingJoinRequests(gymId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('gym_join_requests')
      .select('id, status, created_at, profiles!gym_join_requests_profile_id_fkey(id, email, full_name, avatar_url, phone)')
      .eq('gym_id', gymId)
      .eq('status', 'pending');

    if (error) {
      throw new BadRequestError(error.message, 'JOIN_REQUEST_LIST_FAILED');
    }
    return data ?? [];
  }

  /** Approve a pending join request. */
  static async approveJoinRequest(gymId: string, requestId: string): Promise<void> {
    const { data: request, error: fetchErr } = await supabase
      .from('gym_join_requests')
      .select('id, profile_id, status')
      .eq('id', requestId)
      .eq('gym_id', gymId)
      .maybeSingle();

    if (fetchErr || !request) {
      throw new NotFoundError('Join request not found', 'JOIN_REQUEST_NOT_FOUND');
    }
    if (request.status !== 'pending') {
      throw new BadRequestError('Request is not in pending state', 'INVALID_REQUEST_STATUS');
    }

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone')
      .eq('id', request.profile_id)
      .maybeSingle();

    if (profileErr || !profile) {
      throw new NotFoundError('Customer profile not found', 'PROFILE_NOT_FOUND');
    }

    const { error: profileUpdateErr } = await supabase
      .from('profiles')
      .update({ gym_id: gymId })
      .eq('id', request.profile_id);

    if (profileUpdateErr) {
      throw new BadRequestError(profileUpdateErr.message, 'PROFILE_UPDATE_FAILED');
    }

    let createdMemberId: string | null = null;
    try {
      const { data: existingMember } = await supabase
        .from('members')
        .select('id')
        .eq('gym_id', gymId)
        .eq('profile_id', request.profile_id)
        .maybeSingle();

      if (!existingMember) {
        const { data: memberData, error: memberInsertErr } = await supabase
          .from('members')
          .insert({
            gym_id: gymId,
            profile_id: request.profile_id,
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            status: 'active'
          })
          .select('id')
          .single();

        if (memberInsertErr) {
          throw new BadRequestError(memberInsertErr.message, 'MEMBER_CREATE_FAILED');
        }
        if (memberData) {
          createdMemberId = memberData.id;
        }
      }

      const { error: requestUpdateErr } = await supabase
        .from('gym_join_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (requestUpdateErr) {
        throw new BadRequestError(requestUpdateErr.message, 'REQUEST_UPDATE_FAILED');
      }
    } catch (err) {
      // Rollback profile update
      await supabase
        .from('profiles')
        .update({ gym_id: null })
        .eq('id', request.profile_id);

      // Rollback member insertion
      if (createdMemberId) {
        await supabase
          .from('members')
          .delete()
          .eq('id', createdMemberId);
      }
      throw err;
    }

    await NotificationService.notify({
      recipientId: request.profile_id,
      title: 'Gym Link Approved!',
      body: 'Your request to join the gym has been approved. Welcome aboard!',
      type: 'info',
      gymId
    }).catch(err => console.error('Failed to notify customer:', err));
  }

  /** Reject/Delete a join request. */
  static async rejectJoinRequest(gymId: string, requestId: string): Promise<void> {
    const { data: request, error: fetchErr } = await supabase
      .from('gym_join_requests')
      .select('id, profile_id')
      .eq('id', requestId)
      .eq('gym_id', gymId)
      .maybeSingle();

    if (fetchErr || !request) {
      throw new NotFoundError('Join request not found', 'JOIN_REQUEST_NOT_FOUND');
    }

    const { error: deleteErr } = await supabase
      .from('gym_join_requests')
      .delete()
      .eq('id', requestId);

    if (deleteErr) {
      throw new BadRequestError(deleteErr.message, 'JOIN_REQUEST_DELETE_FAILED');
    }

    await NotificationService.notify({
      recipientId: request.profile_id,
      title: 'Gym Link Request Rejected',
      body: 'Your request to link to the gym was declined by the owner.',
      type: 'info',
      gymId
    }).catch(err => console.error('Failed to notify customer:', err));
  }
}

