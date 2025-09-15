import { AuthenticationError } from "../../../errors/errorHandler";
import { LoginAttempt, AUTH_CONFIG } from "./types";

/**
 * Kelas untuk menangani rate limiting dan tracking login attempts
 */
export class UserAuthenticationRateLimiter {
  private readonly loginAttempts = new Map<string, LoginAttempt>();
  private readonly maxLoginAttempts: number;
  private readonly lockoutDuration: number;

  constructor(
    maxLoginAttempts: number = AUTH_CONFIG.MAX_LOGIN_ATTEMPTS,
    lockoutDuration: number = AUTH_CONFIG.LOCKOUT_DURATION
  ) {
    this.maxLoginAttempts = maxLoginAttempts;
    this.lockoutDuration = lockoutDuration;
  }

  /**
   * Check rate limiting untuk login attempts
   * @param email - Email yang akan dicek
   * @throws AuthenticationError jika terlalu banyak percobaan
   */
  checkRateLimit(email: string): void {
    // Disable rate limiting dalam mode development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔓 Rate limiting disabled in development mode for:', email);
      return;
    }

    const attempts = this.loginAttempts.get(email.toLowerCase());
    
    if (attempts) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
      
      // Reset attempts jika sudah lewat lockout duration
      if (timeSinceLastAttempt > this.lockoutDuration) {
        this.loginAttempts.delete(email.toLowerCase());
        return;
      }
      
      // Check jika masih dalam lockout period
      if (attempts.count >= this.maxLoginAttempts) {
        const remainingTime = Math.ceil((this.lockoutDuration - timeSinceLastAttempt) / 1000 / 60);
        throw new AuthenticationError(
          `Terlalu banyak percobaan login. Coba lagi dalam ${remainingTime} menit.`
        );
      }
    }
  }

  /**
   * Record failed login attempt
   * @param email - Email yang gagal login
   */
  recordFailedAttempt(email: string): void {
    // Skip recording dalam mode development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔓 Failed attempt recording skipped in development mode for:', email);
      return;
    }

    const emailKey = email.toLowerCase();
    const attempts = this.loginAttempts.get(emailKey) || { count: 0, lastAttempt: new Date() };
    
    attempts.count += 1;
    attempts.lastAttempt = new Date();
    
    this.loginAttempts.set(emailKey, attempts);
    
    console.log(`⚠️ Failed login attempt for ${email}: ${attempts.count}/${this.maxLoginAttempts}`);
  }

  /**
   * Reset failed login attempts
   * @param email - Email yang akan di-reset
   */
  resetFailedAttempts(email: string): void {
    this.loginAttempts.delete(email.toLowerCase());
  }

  /**
   * Get current failed attempts count untuk email
   * @param email - Email yang akan dicek
   * @returns Jumlah failed attempts
   */
  getFailedAttemptsCount(email: string): number {
    const attempts = this.loginAttempts.get(email.toLowerCase());
    return attempts ? attempts.count : 0;
  }

  /**
   * Get total failed attempts count (untuk statistics)
   * @returns Total jumlah email yang memiliki failed attempts
   */
  getTotalFailedAttemptsCount(): number {
    return this.loginAttempts.size;
  }

  /**
   * Check apakah email sedang dalam lockout period
   * @param email - Email yang akan dicek
   * @returns true jika sedang dalam lockout
   */
  isInLockoutPeriod(email: string): boolean {
    const attempts = this.loginAttempts.get(email.toLowerCase());
    
    if (!attempts) return false;
    
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
    
    return attempts.count >= this.maxLoginAttempts && timeSinceLastAttempt <= this.lockoutDuration;
  }

  /**
   * Get remaining lockout time dalam menit
   * @param email - Email yang akan dicek
   * @returns Remaining time dalam menit, 0 jika tidak dalam lockout
   */
  getRemainingLockoutTime(email: string): number {
    const attempts = this.loginAttempts.get(email.toLowerCase());
    
    if (!attempts || attempts.count < this.maxLoginAttempts) return 0;
    
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
    
    if (timeSinceLastAttempt > this.lockoutDuration) return 0;
    
    return Math.ceil((this.lockoutDuration - timeSinceLastAttempt) / 1000 / 60);
  }

  /**
   * Clear all failed attempts (untuk testing atau admin purposes)
   */
  clearAllFailedAttempts(): void {
    this.loginAttempts.clear();
    console.log('✅ All failed login attempts cleared');
  }

  /**
   * Clear failed attempts untuk specific email (untuk admin purposes)
   * @param email - Email yang akan di-clear
   */
  clearFailedAttemptsForEmail(email: string): void {
    this.loginAttempts.delete(email.toLowerCase());
    console.log(`✅ Failed login attempts cleared for ${email}`);
  }
}

/**
 * Factory function untuk membuat UserAuthenticationRateLimiter
 * @param maxLoginAttempts - Maximum login attempts (optional)
 * @param lockoutDuration - Lockout duration dalam milliseconds (optional)
 * @returns Instance dari UserAuthenticationRateLimiter
 */
export function createUserAuthenticationRateLimiter(
  maxLoginAttempts?: number,
  lockoutDuration?: number
): UserAuthenticationRateLimiter {
  return new UserAuthenticationRateLimiter(maxLoginAttempts, lockoutDuration);
}