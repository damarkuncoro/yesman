/**
 * Type definitions untuk User Registration Service
 * Berisi semua interface dan type yang digunakan dalam proses registrasi user
 */

/**
 * Data yang diperlukan untuk membuat user baru
 */
export interface UserCreateData {
  name: string;
  email: string;
  password: string;
  department?: string | null;
  region?: string | null;
  level?: number | null;
  roleId?: string;
}

/**
 * Response data user setelah registrasi (tanpa data sensitif)
 */
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  department: string | null;
  region: string | null;
  level: number | null;
  role?: {
    id: string;
    name: string;
    permissions?: string[];
  };
  createdAt: Date;
}

/**
 * Interface untuk User Repository
 */
export interface UserRepository {
  findByEmail(email: string): Promise<any | null>;
  create(data: any): Promise<any>;
  findById(id: string): Promise<any | null>;
}

/**
 * Interface untuk Role Repository
 */
export interface RoleRepository {
  findById(id: string): Promise<any | null>;
  findByName(name: string): Promise<any | null>;
}

/**
 * Hasil bulk registration
 */
export interface BulkRegistrationResult {
  successful: UserResponse[];
  failed: { data: UserCreateData; error: string }[];
}

/**
 * Statistik registrasi user
 */
export interface RegistrationStatistics {
  totalUsers: number;
  usersByDepartment: Record<string, number>;
  usersByRegion: Record<string, number>;
  usersByLevel: Record<number, number>;
  recentRegistrations: number; // dalam 30 hari terakhir
}

/**
 * Valid departments
 */
export const VALID_DEPARTMENTS = [
  'IT', 'HR', 'FINANCE', 'MARKETING', 'SALES', 'OPERATIONS', 'LEGAL'
] as const;

/**
 * Valid regions
 */
export const VALID_REGIONS = [
  'JAKARTA', 'BANDUNG', 'SURABAYA', 'MEDAN', 'MAKASSAR', 'BALI'
] as const;

/**
 * Level range constants
 */
export const LEVEL_CONSTRAINTS = {
  MIN: 1,
  MAX: 10
} as const;

/**
 * Default role name
 */
export const DEFAULT_ROLE_NAME = 'USER' as const;

export type ValidDepartment = typeof VALID_DEPARTMENTS[number];
export type ValidRegion = typeof VALID_REGIONS[number];