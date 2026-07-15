import { adminRepository } from '@/modules/admin/admin.repository';
import { gymRepository } from '@/modules/gym/gym.repository';
import { toAuditLogDto } from '@/modules/admin/admin.dto';
import {
  AuditLogDto,
  OnboardGymInput,
  PlatformStatsDto,
} from '@/modules/admin/admin.types';
import { GymService, GymDto } from '@/modules/gym';
import { AuthService, ProfileDto } from '@/modules/auth';
import { Role } from '@/shared/rbac';
import { ListQuery, PaginatedResult } from '@/shared/types';

/**
 * Platform administration (super admin). Orchestrates gym provisioning, owner
 * onboarding, gym lifecycle changes and platform-wide reporting. This is the
 * only module permitted to operate across tenants.
 */
export class AdminService {
  /** Create a gym and, optionally, its owner account in one step. */
  static async onboardGym(input: OnboardGymInput): Promise<{ gym: GymDto; owner: ProfileDto | null }> {
    const gym = await GymService.createGym({
      name: input.name,
      slug: input.slug,
      email: input.email,
      phone: input.phone,
      address: input.address,
      status: 'active',
    });

    try {
      let owner: ProfileDto | null = null;
      if (input.owner) {
        owner = await AuthService.createManagedUser({
          email: input.owner.email,
          password: input.owner.password,
          fullName: input.owner.fullName,
          role: Role.OWNER,
          gymId: gym.id,
        });

        try {
          await GymService.assignOwner(gym.id, owner.id);
        } catch (err) {
          // Rollback created user if assignOwner fails
          await AuthService.removeUser(owner.id);
          throw err;
        }
      }

      return { gym, owner };
    } catch (err) {
      // Rollback created gym if owner creation or assignment fails
      await gymRepository.hardDelete(gym.id);
      throw err;
    }
  }

  static listGyms(query: ListQuery, status?: string): Promise<PaginatedResult<GymDto>> {
    return GymService.listAll(query, status);
  }

  static getGym(id: string): Promise<GymDto> {
    return GymService.getById(id);
  }

  static approveGym(id: string): Promise<GymDto> {
    return GymService.setStatus(id, 'active');
  }

  static suspendGym(id: string): Promise<GymDto> {
    return GymService.setStatus(id, 'suspended');
  }

  static activateGym(id: string): Promise<GymDto> {
    return GymService.setStatus(id, 'active');
  }

  static platformStats(): Promise<PlatformStatsDto> {
    return adminRepository.platformStats();
  }

  static async listAuditLogs(
    query: ListQuery,
    filters: { gymId?: string; action?: string } = {},
  ): Promise<PaginatedResult<AuditLogDto>> {
    const result = await adminRepository.listAuditLogs({
      page: query.page,
      limit: query.limit,
      offset: query.offset,
      order: query.order,
      gymId: filters.gymId,
      action: filters.action,
    });
    return { ...result, items: result.items.map(toAuditLogDto) };
  }
}
