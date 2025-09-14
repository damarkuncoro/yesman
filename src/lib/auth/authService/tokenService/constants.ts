/**
 * Constants dan Konfigurasi untuk Token Service
 * Menghilangkan hardcode values dan mengikuti prinsip DRY
 */

import type { JWTConfig } from './types';

/**
 * Default JWT configuration
 */
export const JWT_DEFAULTS = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  FALLBACK_SECRET: 'fallback-secret',
  FALLBACK_REFRESH_SECRET: 'fallback-refresh-secret'
} as const;

/**
 * Environment variable keys
 */
export const ENV_KEYS = {
  JWT_SECRET: 'JWT_SECRET',
  JWT_REFRESH_SECRET: 'JWT_REFRESH_SECRET'
} as const;

/**
 * JWT Error types
 */
export const JWT_ERROR_TYPES = {
  TOKEN_EXPIRED: 'TokenExpiredError',
  JSON_WEB_TOKEN_ERROR: 'JsonWebTokenError',
  NOT_BEFORE_ERROR: 'NotBeforeError'
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  USER_NOT_ACTIVE: 'User tidak aktif',
  REFRESH_TOKEN_INVALID: 'Refresh token tidak valid',
  ACCESS_TOKEN_VERIFICATION_FAILED: 'Access token verification failed',
  REFRESH_TOKEN_VERIFICATION_FAILED: 'Refresh token verification failed',
  TOKEN_DECODE_FAILED: 'Token decode failed',
  JWT_SECRETS_NOT_CONFIGURED: '⚠️ JWT secrets not properly configured'
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  TOKEN_GENERATED: 'Tokens generated successfully',
  TOKEN_VERIFIED: 'Token verified successfully',
  TOKEN_REFRESHED: 'Access token refreshed successfully'
} as const;

/**
 * Log prefixes
 */
export const LOG_PREFIXES = {
  ERROR: '❌',
  WARNING: '⚠️',
  SUCCESS: '✅',
  INFO: 'ℹ️'
} as const;

/**
 * Get JWT configuration from environment variables
 * @returns JWTConfig object
 */
export function getJWTConfig(): JWTConfig {
  const accessTokenSecret = process.env[ENV_KEYS.JWT_SECRET] || JWT_DEFAULTS.FALLBACK_SECRET;
  const refreshTokenSecret = process.env[ENV_KEYS.JWT_REFRESH_SECRET] || JWT_DEFAULTS.FALLBACK_REFRESH_SECRET;
  
  // Warn if using fallback secrets
  if (!process.env[ENV_KEYS.JWT_SECRET] || !process.env[ENV_KEYS.JWT_REFRESH_SECRET]) {
    console.warn(`${LOG_PREFIXES.WARNING} ${ERROR_MESSAGES.JWT_SECRETS_NOT_CONFIGURED}`);
  }
  
  return {
    accessTokenSecret,
    refreshTokenSecret,
    accessTokenExpiry: JWT_DEFAULTS.ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: JWT_DEFAULTS.REFRESH_TOKEN_EXPIRY
  };
}

/**
 * Validate JWT configuration
 * @param config - JWT configuration to validate
 * @returns boolean indicating if configuration is valid
 */
export function validateJWTConfig(config: JWTConfig): boolean {
  return (
    !!config.accessTokenSecret &&
    !!config.refreshTokenSecret &&
    !!config.accessTokenExpiry &&
    !!config.refreshTokenExpiry &&
    config.accessTokenSecret !== JWT_DEFAULTS.FALLBACK_SECRET &&
    config.refreshTokenSecret !== JWT_DEFAULTS.FALLBACK_REFRESH_SECRET
  );
}

/**
 * Get current timestamp in seconds (for JWT)
 * @returns Current timestamp in seconds
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}