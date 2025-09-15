/**
 * Types dan Interfaces untuk Token Service
 * Mengikuti prinsip DRY dan type safety
 */

/**
 * Payload yang disimpan dalam JWT token
 */
export interface JWTPayload {
  userId: number;
  email: string;
  iat?: number; // issued at
  exp?: number; // expiration time
}

/**
 * Data yang digunakan untuk generate token
 */
export interface TokenGenerationPayload {
  userId: number;
  email: string;
}

/**
 * Response dari token generation
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Response from refresh token operation
 */
export interface RefreshTokenResponse {
  accessToken: string;
}

/**
 * Token data untuk localStorage storage
 * Kompatibilitas dengan tokenService.ts yang lama
 */
export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * Konfigurasi JWT
 */
export interface JWTConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

/**
 * Token verification result
 */
export interface TokenVerificationResult {
  isValid: boolean;
  payload?: JWTPayload;
  error?: string;
}

/**
 * Token decode result
 */
export interface TokenDecodeResult {
  success: boolean;
  payload?: JWTPayload;
  error?: string;
}

/**
 * User repository interface untuk dependency injection
 */
export interface UserRepository {
  findById(id: number): Promise<{ id: number; email: string; active: boolean } | null>;
}

/**
 * Token service interface untuk testing dan mocking
 */
export interface ITokenService {
  generateTokens(payload: TokenGenerationPayload): TokenPair;
  verifyAccessToken(token: string): Promise<JWTPayload | null>;
  verifyRefreshToken(token: string): Promise<JWTPayload>;
  refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse>;
  decodeToken(token: string): JWTPayload | null;
  isTokenExpired(token: string): boolean;
}

/**
 * Token generator interface
 */
export interface ITokenGenerator {
  generateAccessToken(payload: TokenGenerationPayload): string;
  generateRefreshToken(payload: TokenGenerationPayload): string;
  generateTokens(payload: TokenGenerationPayload): TokenPair;
}

/**
 * Token validator interface
 */
export interface ITokenValidator {
  verifyAccessToken(token: string): Promise<JWTPayload | null>;
  verifyRefreshToken(token: string): Promise<JWTPayload>;
  validateUserStatus(userId: number): Promise<boolean>;
}

/**
 * Token utilities interface
 */
export interface ITokenUtils {
  decodeToken(token: string): JWTPayload | null;
  isTokenExpired(token: string): boolean;
  getTokenExpirationTime(token: string): number | null;
  getTokenIssuedTime(token: string): number | null;
}