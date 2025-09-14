/**
 * Token Validator Service
 * Menangani verifikasi dan validasi JWT tokens
 * Mengikuti Single Responsibility Principle
 */

import jwt from 'jsonwebtoken';
import type { 
  JWTPayload, 
  ITokenValidator,
  JWTConfig,
  UserRepository 
} from './types';
import { 
  getJWTConfig, 
  JWT_ERROR_TYPES, 
  ERROR_MESSAGES, 
  LOG_PREFIXES 
} from './constants';
import { AuthenticationError } from '../../../errors/errorHandler';

/**
 * Token Validator Class
 * Bertanggung jawab untuk verifikasi dan validasi JWT tokens
 */
export class TokenValidator implements ITokenValidator {
  private readonly config: JWTConfig;
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository, config?: JWTConfig) {
    this.userRepository = userRepository;
    this.config = config || getJWTConfig();
  }

  /**
   * Verifikasi JWT access token dan return payload
   * @param token - JWT token yang akan diverifikasi
   * @returns JWTPayload jika valid, null jika tidak valid
   */
  async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      const payload = jwt.verify(
        token, 
        this.config.accessTokenSecret as string
      ) as JWTPayload;
      
      // Validasi apakah user masih aktif
      const isUserActive = await this.validateUserStatus(payload.userId);
      if (!isUserActive) {
        return null;
      }
      
      return payload;
    } catch (error) {
      // Log hanya untuk error yang bukan TokenExpiredError
      if (error instanceof Error && error.name !== JWT_ERROR_TYPES.TOKEN_EXPIRED) {
        console.error(
          `${LOG_PREFIXES.ERROR} ${ERROR_MESSAGES.ACCESS_TOKEN_VERIFICATION_FAILED}:`, 
          error
        );
      }
      return null;
    }
  }

  /**
   * Verifikasi refresh token
   * @param token - Refresh token yang akan diverifikasi
   * @returns JWTPayload jika valid
   * @throws AuthenticationError jika tidak valid
   */
  async verifyRefreshToken(token: string): Promise<JWTPayload> {
    try {
      const payload = jwt.verify(
        token, 
        this.config.refreshTokenSecret as string
      ) as JWTPayload;
      
      // Validasi apakah user masih aktif
      const isUserActive = await this.validateUserStatus(payload.userId);
      if (!isUserActive) {
        throw new AuthenticationError(ERROR_MESSAGES.USER_NOT_ACTIVE);
      }
      
      return payload;
    } catch (error) {
      // Log hanya untuk error yang bukan TokenExpiredError
      if (error instanceof Error && error.name !== JWT_ERROR_TYPES.TOKEN_EXPIRED) {
        console.error(
          `${LOG_PREFIXES.ERROR} ${ERROR_MESSAGES.REFRESH_TOKEN_VERIFICATION_FAILED}:`, 
          error
        );
      }
      
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      throw new AuthenticationError(ERROR_MESSAGES.REFRESH_TOKEN_INVALID);
    }
  }

  /**
   * Validasi status user (aktif/tidak aktif)
   * @param userId - ID user yang akan divalidasi
   * @returns true jika user aktif, false jika tidak
   */
  async validateUserStatus(userId: number): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      return !!(user && user.active);
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to validate user status:`, error);
      return false;
    }
  }

  /**
   * Verifikasi token tanpa validasi user status
   * Berguna untuk debugging atau special cases
   * @param token - Token yang akan diverifikasi
   * @param isRefreshToken - Apakah ini refresh token
   * @returns JWTPayload jika valid, null jika tidak
   */
  verifyTokenOnly(token: string, isRefreshToken: boolean = false): JWTPayload | null {
    try {
      const secret = isRefreshToken 
        ? this.config.refreshTokenSecret 
        : this.config.accessTokenSecret;
      
      const payload = jwt.verify(token, secret as string) as JWTPayload;
      return payload;
    } catch (error) {
      if (error instanceof Error && error.name !== JWT_ERROR_TYPES.TOKEN_EXPIRED) {
        console.error(`${LOG_PREFIXES.ERROR} Token verification failed:`, error);
      }
      return null;
    }
  }

  /**
   * Batch verify multiple tokens
   * @param tokens - Array of tokens to verify
   * @param isRefreshToken - Whether these are refresh tokens
   * @returns Array of verification results
   */
  async batchVerifyTokens(
    tokens: string[], 
    isRefreshToken: boolean = false
  ): Promise<(JWTPayload | null)[]> {
    const verificationPromises = tokens.map(token => 
      isRefreshToken 
        ? this.verifyRefreshToken(token).catch(() => null)
        : this.verifyAccessToken(token)
    );
    
    return Promise.all(verificationPromises);
  }

  /**
   * Get token configuration
   * @returns Current JWT configuration
   */
  getConfig(): JWTConfig {
    return { ...this.config };
  }

  /**
   * Update token configuration
   * @param newConfig - New JWT configuration
   */
  updateConfig(newConfig: Partial<JWTConfig>): void {
    Object.assign(this.config, newConfig);
  }
}

/**
 * Factory function untuk membuat TokenValidator
 * @param userRepository - User repository instance
 * @param config - Optional JWT configuration
 * @returns TokenValidator instance
 */
export function createTokenValidator(
  userRepository: UserRepository, 
  config?: JWTConfig
): TokenValidator {
  return new TokenValidator(userRepository, config);
}

/**
 * Export untuk backward compatibility
 */
export default TokenValidator;