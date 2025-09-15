/**
 * Token Service - Main Entry Point
 * Menggabungkan semua token-related services menjadi satu interface yang unified
 * Mengikuti Facade Pattern dan Single Responsibility Principle
 */

import type { 
  JWTConfig, 
  UserRepository, 
  TokenGenerationPayload, 
  JWTPayload, 
  TokenPair,
  TokenData,
  ITokenService 
} from './types';
import { TokenGenerator, createTokenGenerator } from './tokenGenerator';
import { TokenValidator, createTokenValidator } from './tokenValidator';
import { TokenUtils, createTokenUtils } from './tokenUtils';
import { TokenStorage, createTokenStorage } from './tokenStorage';
import { getJWTConfig, LOG_PREFIXES, SUCCESS_MESSAGES } from './constants';
import { AuthenticationError } from '../../../errors/errorHandler';

/**
 * Main Token Service Class
 * Facade yang menggabungkan semua token operations
 */
export class TokenService implements ITokenService {
  private readonly tokenGenerator: TokenGenerator;
  private readonly tokenValidator: TokenValidator;
  private readonly tokenUtils: TokenUtils;
  private readonly tokenStorage: TokenStorage;
  private readonly userRepository: UserRepository;
  private readonly config: JWTConfig;

  constructor(userRepository: UserRepository, config?: JWTConfig) {
    this.userRepository = userRepository;
    this.config = config || getJWTConfig();
    
    // Initialize sub-services
    this.tokenGenerator = createTokenGenerator(this.config);
    this.tokenValidator = createTokenValidator(userRepository, this.config);
    this.tokenUtils = createTokenUtils();
    this.tokenStorage = createTokenStorage();
  }

  /**
   * Generate both access and refresh tokens
   * @param payload - Data yang akan disimpan dalam token
   * @returns Object berisi access dan refresh token
   */
  generateTokens(payload: TokenGenerationPayload): TokenPair {
    try {
      const accessToken = this.tokenGenerator.generateAccessToken(payload);
      const refreshToken = this.tokenGenerator.generateRefreshToken(payload);
      
      console.log(`${LOG_PREFIXES.SUCCESS} ${SUCCESS_MESSAGES.TOKEN_GENERATED}`);
      
      return {
        accessToken,
        refreshToken
      };
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to generate tokens:`, error);
      throw new Error('Failed to generate tokens');
    }
  }

  /**
   * Verifikasi access token
   * @param token - Access token yang akan diverifikasi
   * @returns JWTPayload jika valid, null jika tidak valid
   */
  async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    return this.tokenValidator.verifyAccessToken(token);
  }

  /**
   * Verifikasi refresh token
   * @param token - Refresh token yang akan diverifikasi
   * @returns JWTPayload jika valid
   * @throws AuthenticationError jika tidak valid
   */
  async verifyRefreshToken(token: string): Promise<JWTPayload> {
    return this.tokenValidator.verifyRefreshToken(token);
  }

  /**
   * Refresh access token menggunakan refresh token
   * @param refreshToken - Refresh token yang valid
   * @returns TokenPair baru
   * @throws AuthenticationError jika refresh token tidak valid
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verifikasi refresh token
      const payload = await this.verifyRefreshToken(refreshToken);
      
      // Generate tokens baru dengan payload yang sama
      const newTokens = this.generateTokens({
        userId: payload.userId,
        email: payload.email
      });
      
      console.log(`${LOG_PREFIXES.SUCCESS} ${SUCCESS_MESSAGES.TOKEN_REFRESHED}`);
      
      return newTokens;
    } catch (error) {
      console.error(`${LOG_PREFIXES.ERROR} Failed to refresh access token:`, error);
      
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      throw new AuthenticationError('Failed to refresh access token');
    }
  }

  /**
   * Decode token tanpa verifikasi
   * @param token - JWT token yang akan di-decode
   * @returns Decoded payload atau null jika gagal
   */
  decodeToken(token: string): JWTPayload | null {
    return this.tokenUtils.decodeToken(token);
  }

  /**
   * Cek apakah token sudah expired
   * @param token - JWT token yang akan dicek
   * @returns true jika expired, false jika masih valid
   */
  isTokenExpired(token: string): boolean {
    return this.tokenUtils.isTokenExpired(token);
  }

  /**
   * Get token expiration time
   * @param token - JWT token
   * @returns Expiration timestamp atau null jika gagal
   */
  getTokenExpirationTime(token: string): number | null {
    return this.tokenUtils.getTokenExpirationTime(token);
  }

  /**
   * Get token issued time
   * @param token - JWT token
   * @returns Issued at timestamp atau null jika gagal
   */
  getTokenIssuedTime(token: string): number | null {
    return this.tokenUtils.getTokenIssuedTime(token);
  }

  /**
   * Get remaining time until token expires
   * @param token - JWT token
   * @returns Remaining seconds atau null jika gagal/expired
   */
  getTokenRemainingTime(token: string): number | null {
    return this.tokenUtils.getTokenRemainingTime(token);
  }

  /**
   * Extract user ID from token
   * @param token - JWT token
   * @returns User ID atau null jika gagal
   */
  extractUserId(token: string): number | null {
    return this.tokenUtils.extractUserId(token);
  }

  /**
   * Extract user email from token
   * @param token - JWT token
   * @returns User email atau null jika gagal
   */
  extractUserEmail(token: string): string | null {
    return this.tokenUtils.extractUserEmail(token);
  }

  /**
   * Validate token format
   * @param token - Token string to validate
   * @returns true jika format valid, false jika tidak
   */
  isValidTokenFormat(token: string): boolean {
    return this.tokenUtils.isValidTokenFormat(token);
  }

  /**
   * Check if token will expire soon
   * @param token - JWT token
   * @param thresholdSeconds - Threshold in seconds (default: 300 = 5 minutes)
   * @returns true jika akan expire dalam threshold, false jika tidak
   */
  willExpireSoon(token: string, thresholdSeconds: number = 300): boolean {
    return this.tokenUtils.willExpireSoon(token, thresholdSeconds);
  }

  /**
   * Batch operations untuk multiple tokens
   * @param tokens - Array of tokens
   * @param isRefreshToken - Whether these are refresh tokens
   * @returns Array of verification results
   */
  async batchVerifyTokens(
    tokens: string[], 
    isRefreshToken: boolean = false
  ): Promise<(JWTPayload | null)[]> {
    return this.tokenValidator.batchVerifyTokens(tokens, isRefreshToken);
  }

  /**
   * Batch decode multiple tokens
   * @param tokens - Array of tokens to decode
   * @returns Array of decoded payloads
   */
  batchDecodeTokens(tokens: string[]): (JWTPayload | null)[] {
    return this.tokenUtils.batchDecodeTokens(tokens);
  }

  /**
   * Get current configuration
   * @returns Current JWT configuration
   */
  getConfig(): JWTConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param newConfig - New JWT configuration
   */
  updateConfig(newConfig: Partial<JWTConfig>): void {
    Object.assign(this.config, newConfig);
    this.tokenValidator.updateConfig(newConfig);
    this.tokenGenerator.updateConfig(newConfig);
  }

  /**
   * Get sub-services untuk testing atau advanced usage
   * @returns Object dengan semua sub-services
   */
  getSubServices() {
    return {
      tokenGenerator: this.tokenGenerator,
      tokenValidator: this.tokenValidator,
      tokenUtils: this.tokenUtils,
      tokenStorage: this.tokenStorage
    };
  }

  // ===== STORAGE METHODS (Kompatibilitas dengan tokenService.ts lama) =====

  /**
   * Menyimpan token data ke localStorage
   * @param tokenData - Data token yang akan disimpan
   */
  setTokens(tokenData: TokenData): void {
    this.tokenStorage.setTokens(tokenData);
  }

  /**
   * Mengambil access token dari localStorage
   * @returns Access token atau null jika tidak ada
   */
  getAccessToken(): string | null {
    return this.tokenStorage.getAccessToken();
  }

  /**
   * Mengambil refresh token dari localStorage
   * @returns Refresh token atau null jika tidak ada
   */
  getRefreshToken(): string | null {
    return this.tokenStorage.getRefreshToken();
  }

  /**
   * Mengambil waktu expired token dari localStorage
   * @returns Timestamp expired atau null jika tidak ada
   */
  getTokenExpiresAt(): number | null {
    return this.tokenStorage.getTokenExpiresAt();
  }

  /**
   * Mengambil semua token data dari localStorage
   * @returns Object dengan semua token data
   */
  getAllTokens(): TokenData | null {
    return this.tokenStorage.getAllTokens();
  }

  /**
   * Menghapus semua token dari localStorage
   */
  clearTokens(): void {
    this.tokenStorage.clearTokens();
  }

  /**
   * Mengecek apakah access token sudah expired (dari localStorage)
   * @returns true jika token expired, false jika masih valid
   */
  isStoredTokenExpired(): boolean {
    return this.tokenStorage.isTokenExpired();
  }

  /**
   * Mengecek apakah token akan expired dalam waktu tertentu (dari localStorage)
   * @param minutes - Waktu dalam menit untuk mengecek
   * @returns true jika token akan expired dalam waktu yang ditentukan
   */
  willStoredTokenExpireIn(minutes: number): boolean {
    return this.tokenStorage.willTokenExpireIn(minutes);
  }

  /**
   * Decode JWT token untuk mendapatkan payload (tanpa verifikasi)
   * Alias untuk decodeToken untuk kompatibilitas
   * @param token - JWT token
   * @returns Decoded payload atau null jika gagal
   */
  decodeJWTToken(token: string): JWTPayload | null {
    return this.decodeToken(token);
  }
}

/**
 * Factory function untuk membuat TokenService
 * @param userRepository - User repository instance
 * @param config - Optional JWT configuration
 * @returns TokenService instance
 */
export function createTokenService(
  userRepository: UserRepository, 
  config?: JWTConfig
): TokenService {
  return new TokenService(userRepository, config);
}

/**
 * Export semua sub-services untuk penggunaan individual
 */
export {
  TokenGenerator,
  TokenValidator,
  TokenUtils,
  TokenStorage,
  createTokenGenerator,
  createTokenValidator,
  createTokenUtils,
  createTokenStorage
};

/**
 * Export types
 */
export type {
  JWTConfig,
  UserRepository,
  TokenGenerationPayload,
  JWTPayload,
  TokenPair,
  TokenData,
  ITokenService,
  ITokenGenerator,
  ITokenValidator,
  ITokenUtils
} from './types';

export type { ITokenStorage } from './tokenStorage';

/**
 * Export constants
 */
export {
  getJWTConfig,
  validateJWTConfig,
  getCurrentTimestamp,
  JWT_ERROR_TYPES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOG_PREFIXES
} from './constants';

/**
 * Export untuk backward compatibility
 */
export default TokenService;