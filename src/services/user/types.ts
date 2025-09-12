import type { User } from '@/db/schema';
import type { UserCreateInput } from '@/lib/validation/schemas';

// Re-export types
export type { User, UserCreateInput };

/**
 * Interface untuk response authentication
 */
export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

/**
 * Interface untuk JWT payload
 */
export interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Interface untuk update user profile
 */
export interface UserProfileUpdateData {
  name?: string;
  email?: string;
}

/**
 * Interface untuk user yang sudah disanitasi (tanpa password hash)
 */
export type SanitizedUser = Omit<User, 'passwordHash'>;