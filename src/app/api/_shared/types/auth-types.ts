/**
 * Authentication Types
 * Interface dan type untuk authentication dan authorization
 * Menerapkan Single Responsibility Principle (SRP)
 */

/**
 * Interface untuk data user yang dikembalikan dari API
 */
export interface UserData {
  id: number;
  name: string;
  email: string;
  role?: string;
  permissions?: string[];
}

/**
 * Interface untuk response dengan token
 */
export interface TokenResponse {
  user: UserData;
  accessToken: string;
  refreshToken: string;
}

/**
 * Interface untuk cookie configuration
 */
export interface CookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
}