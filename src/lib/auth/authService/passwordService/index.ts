import { PasswordHasher, passwordHasher } from './passwordHasher';
import { PasswordValidator, passwordValidator } from './passwordValidator';
import { PasswordGenerator, passwordGenerator } from './passwordGenerator';
import { PasswordStrengthChecker, passwordStrengthChecker, PasswordStrengthResult } from './passwordStrengthChecker';
import { PasswordManager, UserPasswordRepository, PasswordAuditLogger, createPasswordManager } from './passwordManager';
import { ValidationError } from '../../../errors/errorHandler';

/**
 * PasswordService
 * Service utama yang menggabungkan semua komponen password management
 * Mengikuti Facade Pattern untuk menyediakan interface yang sederhana
 */
export class PasswordService {
  constructor(
    private hasher: PasswordHasher = passwordHasher,
    private validator: PasswordValidator = passwordValidator,
    private generator: PasswordGenerator = passwordGenerator,
    private strengthChecker: PasswordStrengthChecker = passwordStrengthChecker,
    private manager?: PasswordManager
  ) {}

  // ===== PASSWORD HASHING & VERIFICATION =====

  /**
   * Hash password menggunakan bcrypt
   * @param password - Password plain text
   * @returns Promise<string> - Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    this.validator.validatePassword(password);
    return this.hasher.hashPassword(password);
  }

  /**
   * Verifikasi password dengan hash
   * @param password - Password plain text
   * @param hashedPassword - Hashed password dari database
   * @returns Promise<boolean> - true jika password cocok
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return this.hasher.verifyPassword(password, hashedPassword);
  }

  // ===== PASSWORD VALIDATION =====

  /**
   * Validasi format password
   * @param password - Password yang akan divalidasi
   * @throws ValidationError jika password tidak valid
   */
  validatePassword(password: string): void {
    this.validator.validatePassword(password);
  }

  /**
   * Validasi password dengan informasi personal
   * @param password - Password yang akan divalidasi
   * @param personalInfo - Array informasi personal
   * @throws ValidationError jika password tidak valid
   */
  validatePasswordWithPersonalInfo(password: string, personalInfo: string[]): void {
    this.validator.validateWithPersonalInfo(password, personalInfo);
  }

  /**
   * Check apakah password mengandung informasi personal
   * @param password - Password yang akan dicek
   * @param personalInfo - Array informasi personal
   * @returns boolean - true jika mengandung informasi personal
   */
  containsPersonalInfo(password: string, personalInfo: string[]): boolean {
    return this.validator.containsPersonalInfo(password, personalInfo);
  }

  // ===== PASSWORD GENERATION =====

  /**
   * Generate random password yang aman
   * @param length - Panjang password (default: 12)
   * @param options - Opsi untuk karakter yang digunakan
   * @returns string - Random password yang memenuhi kriteria kompleksitas
   */
  generateSecurePassword(
    length: number = 12,
    options?: {
      includeUppercase?: boolean;
      includeLowercase?: boolean;
      includeNumbers?: boolean;
      includeSpecialChars?: boolean;
    }
  ): string {
    return this.generator.generateSecurePassword(length, options);
  }

  /**
   * Generate password dengan template tertentu
   * @param template - Template password (contoh: 'Aa1!Aa1!Aa1!')
   * @returns string - Password berdasarkan template
   */
  generateFromTemplate(template: string): string {
    return this.generator.generateFromTemplate(template);
  }

  /**
   * Generate multiple passwords sekaligus
   * @param count - Jumlah password yang akan dibuat
   * @param length - Panjang setiap password
   * @returns string[] - Array password yang dihasilkan
   */
  generateMultiplePasswords(count: number, length: number = 12): string[] {
    return this.generator.generateMultiplePasswords(count, length);
  }

  /**
   * Generate password yang mudah diingat (pronounceable)
   * @param length - Panjang password
   * @returns string - Password yang mudah diingat
   */
  generatePronounceablePassword(length: number = 8): string {
    return this.generator.generatePronounceablePassword(length);
  }

  // ===== PASSWORD STRENGTH ANALYSIS =====

  /**
   * Check kekuatan password
   * @param password - Password yang akan dicek
   * @returns PasswordStrengthResult - Hasil analisis kekuatan password
   */
  checkPasswordStrength(password: string): PasswordStrengthResult {
    return this.strengthChecker.checkPasswordStrength(password);
  }

  /**
   * Mendapatkan rekomendasi untuk meningkatkan kekuatan password
   * @param password - Password yang akan dianalisis
   * @returns string[] - Array rekomendasi
   */
  getPasswordRecommendations(password: string): string[] {
    return this.strengthChecker.getPasswordRecommendations(password);
  }

  // ===== PASSWORD MANAGEMENT (requires PasswordManager) =====

  /**
   * Set PasswordManager untuk operasi change/reset
   * @param manager - PasswordManager instance
   */
  setPasswordManager(manager: PasswordManager): void {
    this.manager = manager;
  }

  /**
   * Change user password
   * @param userId - ID user
   * @param currentPassword - Password saat ini
   * @param newPassword - Password baru
   * @param personalInfo - Informasi personal untuk validasi
   * @returns Promise<void>
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    personalInfo: string[] = []
  ): Promise<void> {
    if (!this.manager) {
      throw new Error('PasswordManager belum diset. Gunakan setPasswordManager() terlebih dahulu.');
    }
    return this.manager.changePassword(userId, currentPassword, newPassword, personalInfo);
  }

  /**
   * Reset user password
   * @param userId - ID user
   * @param newPassword - Password baru
   * @param personalInfo - Informasi personal untuk validasi
   * @param adminUserId - ID admin yang melakukan reset
   * @returns Promise<void>
   */
  async resetPassword(
    userId: number,
    newPassword: string,
    personalInfo: string[] = [],
    adminUserId?: number
  ): Promise<void> {
    if (!this.manager) {
      throw new Error('PasswordManager belum diset. Gunakan setPasswordManager() terlebih dahulu.');
    }
    return this.manager.resetPassword(userId, newPassword, personalInfo, adminUserId);
  }

  /**
   * Validasi password baru sebelum change/reset
   * @param newPassword - Password baru
   * @param personalInfo - Informasi personal
   * @returns object - Hasil validasi dan analisis kekuatan
   */
  async validateNewPassword(
    newPassword: string,
    personalInfo: string[] = []
  ): Promise<{
    isValid: boolean;
    errors: string[];
    strengthResult: PasswordStrengthResult;
  }> {
    if (!this.manager) {
      throw new Error('PasswordManager belum diset. Gunakan setPasswordManager() terlebih dahulu.');
    }
    return this.manager.validateNewPassword(newPassword, personalInfo);
  }

  // ===== UTILITY METHODS =====

  /**
   * Mendapatkan konfigurasi panjang password
   * @returns object - Min dan max length
   */
  getPasswordLengthConfig(): { min: number; max: number } {
    return this.validator.getPasswordLengthConfig();
  }

  /**
   * Mendapatkan konfigurasi karakter yang tersedia
   * @returns object - Konfigurasi karakter
   */
  getCharacterSets(): {
    uppercase: string;
    lowercase: string;
    numbers: string;
    specialChars: string;
  } {
    return this.generator.getCharacterSets();
  }

  /**
   * Mendapatkan salt rounds yang digunakan untuk hashing
   * @returns number - Jumlah salt rounds
   */
  getSaltRounds(): number {
    return this.hasher.getSaltRounds();
  }
}

/**
 * Factory function untuk membuat PasswordService dengan PasswordManager
 * @param userRepository - Repository untuk operasi user
 * @param auditLogger - Logger untuk audit (opsional)
 * @returns PasswordService instance dengan PasswordManager
 */
export function createPasswordService(
  userRepository?: UserPasswordRepository,
  auditLogger?: PasswordAuditLogger
): PasswordService {
  const service = new PasswordService();
  
  if (userRepository) {
    const manager = createPasswordManager(userRepository, auditLogger);
    service.setPasswordManager(manager);
  }
  
  return service;
}

// Export singleton instance (tanpa PasswordManager)
export const passwordService = new PasswordService();

// Export semua komponen untuk penggunaan individual
export {
  PasswordHasher,
  PasswordValidator,
  PasswordGenerator,
  PasswordStrengthChecker,
  PasswordManager,
  passwordHasher,
  passwordValidator,
  passwordGenerator,
  passwordStrengthChecker,
  createPasswordManager
};

// Export types
export type {
  PasswordStrengthResult,
  UserPasswordRepository,
  PasswordAuditLogger
};

// Default export
export default passwordService;