import { ValidationError } from "../../../errors/errorHandler";
import { LoginCredentials } from "./types";

/**
 * Kelas untuk menangani validasi authentication
 */
export class UserAuthenticationValidator {
  /**
   * Validasi login credentials
   * @param credentials - Credentials yang akan divalidasi
   * @throws ValidationError jika credentials tidak valid
   */
  validateLoginCredentials(credentials: LoginCredentials): void {
    if (!credentials.email || credentials.email.trim().length === 0) {
      throw new ValidationError('Email harus diisi');
    }

    if (!credentials.password || credentials.password.length === 0) {
      throw new ValidationError('Password harus diisi');
    }

    // Validasi format email
    this.validateEmailFormat(credentials.email);
  }

  /**
   * Validasi format email
   * @param email - Email yang akan divalidasi
   * @throws ValidationError jika format email tidak valid
   */
  private validateEmailFormat(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Format email tidak valid');
    }
  }

  /**
   * Validasi refresh token request
   * @param refreshToken - Refresh token yang akan divalidasi
   * @throws ValidationError jika refresh token tidak valid
   */
  validateRefreshToken(refreshToken: string): void {
    if (!refreshToken || refreshToken.trim().length === 0) {
      throw new ValidationError('Refresh token harus diisi');
    }
  }

  /**
   * Validasi session token
   * @param sessionToken - Session token yang akan divalidasi
   * @throws ValidationError jika session token tidak valid
   */
  validateSessionToken(sessionToken: string): void {
    if (!sessionToken || sessionToken.trim().length === 0) {
      throw new ValidationError('Session token harus diisi');
    }
  }

  /**
   * Validasi user ID
   * @param userId - User ID yang akan divalidasi
   * @throws ValidationError jika user ID tidak valid
   */
  validateUserId(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new ValidationError('User ID harus diisi');
    }
  }

  /**
   * Validasi session ID
   * @param sessionId - Session ID yang akan divalidasi
   * @throws ValidationError jika session ID tidak valid
   */
  validateSessionId(sessionId: string): void {
    if (!sessionId || sessionId.trim().length === 0) {
      throw new ValidationError('Session ID harus diisi');
    }
  }
}

/**
 * Factory function untuk membuat UserAuthenticationValidator
 * @returns Instance dari UserAuthenticationValidator
 */
export function createUserAuthenticationValidator(): UserAuthenticationValidator {
  return new UserAuthenticationValidator();
}