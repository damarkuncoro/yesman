/**
 * Token Generator Service
 * Menangani pembuatan access dan refresh tokens
 * Mengikuti Single Responsibility Principle
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import type { 
  TokenGenerationPayload, 
  TokenPair, 
  ITokenGenerator,
  JWTConfig 
} from './types';
import { getJWTConfig, SUCCESS_MESSAGES, LOG_PREFIXES } from './constants';

/**
 * Token Generator Class
 * Bertanggung jawab untuk generate JWT tokens
 */
export class TokenGenerator implements ITokenGenerator {
  private readonly config: JWTConfig;

  constructor(config?: JWTConfig) {
    this.config = config || getJWTConfig();
  }

  /**
   * Generate access token
   * @param payload - Data yang akan disimpan dalam token
   * @returns Access token string
   */
  generateAccessToken(payload: TokenGenerationPayload): string {
    try {
      const options: SignOptions = {
            expiresIn: this.config.accessTokenExpiry as any,
            algorithm: 'HS256'
          };
      
      const accessToken = jwt.sign(
        payload,
        this.config.accessTokenSecret as string,
        options
      );
      
      return accessToken;
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to generate access token:`, error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate refresh token
   * @param payload - Data yang akan disimpan dalam token
   * @returns Refresh token string
   */
  generateRefreshToken(payload: TokenGenerationPayload): string {
    try {
      const refreshOptions: SignOptions = {
            expiresIn: this.config.refreshTokenExpiry as any,
            algorithm: 'HS256'
          };
      
      const refreshToken = jwt.sign(
        payload,
        this.config.refreshTokenSecret as string,
        refreshOptions
      );
      
      return refreshToken;
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to generate refresh token:`, error);
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Generate both access dan refresh token
   * @param payload - Data yang akan disimpan dalam token
   * @returns Object berisi access dan refresh token
   */
  generateTokens(payload: TokenGenerationPayload): TokenPair {
    try {
      const accessToken = this.generateAccessToken(payload);
      const refreshToken = this.generateRefreshToken(payload);
      
      console.log(`${LOG_PREFIXES.SUCCESS} ${SUCCESS_MESSAGES.TOKEN_GENERATED}`);
      
      return { accessToken, refreshToken };
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to generate token pair:`, error);
      throw new Error('Failed to generate token pair');
    }
  }

  /**
   * Generate new access token from existing payload
   * Berguna untuk refresh token operation
   * @param payload - Existing JWT payload
   * @returns New access token
   */
  generateNewAccessToken(payload: { userId: number; email: string }): string {
    return this.generateAccessToken({
      userId: payload.userId,
      email: payload.email
    });
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
 * Factory function untuk membuat TokenGenerator
 * @param config - Optional JWT configuration
 * @returns TokenGenerator instance
 */
export function createTokenGenerator(config?: JWTConfig): TokenGenerator {
  return new TokenGenerator(config);
}

/**
 * Default token generator instance
 */
export const tokenGenerator = createTokenGenerator();

/**
 * Export untuk backward compatibility
 */
export default tokenGenerator;