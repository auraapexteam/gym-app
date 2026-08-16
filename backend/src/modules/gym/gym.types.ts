export type GymStatus = 'active' | 'suspended' | 'pending';

export interface GymTiming {
  open: string;
  close: string;
}

export type GymTimings = Record<string, GymTiming>;

export interface GymRow {
  id: string;
  name: string;
  slug: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  logo_url: string | null;
  status: GymStatus;
  timings: GymTimings;
  weekly_off: string[];
  settings: Record<string, unknown>;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Full gym view — returned to owners/staff who manage the gym. */
export interface GymDto {
  id: string;
  name: string;
  slug: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  logoUrl: string | null;
  status: GymStatus;
  timings: GymTimings;
  weeklyOff: string[];
  settings: Record<string, unknown>;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Public gym view — safe to expose to customers. */
export interface PublicGymDto {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  description: string | null;
  logoUrl: string | null;
  timings: GymTimings;
  weeklyOff: string[];
  status: GymStatus;
}

export interface CreateGymInput {
  name: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  status?: GymStatus;
}

export interface UpdateGymInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  logoUrl?: string;
  timings?: GymTimings;
  weeklyOff?: string[];
  settings?: Record<string, unknown>;
}

export interface SavedGymRow {
  id: string;
  profile_id: string;
  gym_id: string;
  created_at: string;
}

export interface SavedGymDto {
  id: string;
  name: string;
  slug?: string | null;
  address?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  imageUrl?: string | null;
  rating?: number;
  monthlyPrice?: number | null;
  timings?: GymTimings;
  weeklyOff?: string[];
  status?: GymStatus;
  savedAt?: string;
}

export interface BookmarkToggleResult {
  isSaved: boolean;
  gymId: string;
}

