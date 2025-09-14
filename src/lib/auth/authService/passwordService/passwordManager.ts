import { ValidationError } from "../../../errors/errorHandler";
import { PasswordHasher } from "./passwordHasher";
import { PasswordValidator } from "./passwordValidator";
import { PasswordStrengthChecker } from "./passwordStrengthChecker";

/**
 * Interface untuk user repository yang dibutuhkan PasswordManager
 */
export interface UserPasswordRepository {
  findById(userId: number): Promise<{ id: number; password: string; email?: string; name?: string } | null>;
  updatePassword(userId: number, hashedPassword: string): Promise<void>;
}

/**
 * Interface untuk audit log
 */
export interface PasswordAuditLogger {
  logPasswordChange(userId: number, action: 'change' | 'reset', metadata?: any): Promise<void>;
}

/**
 * PasswordManager
 * Bertanggung jawab untuk menangani operasi change dan reset password
 * Mengikuti Single Responsibility Principle dan Dependency Injection
 */
export class PasswordManager {
  constructor(
    private userRepository: UserPasswordRepository,
    private passwordHasher: PasswordHasher,
    private passwordValidator: PasswordValidator,
    private strengthChecker: PasswordStrengthChecker,
    private auditLogger?: PasswordAuditLogger
  ) {}

  /**
   * Change user password dengan validasi password lama
   * @param userId - ID user
   * @param currentPassword - Password saat ini
   * @param newPassword - Password baru
   * @param personalInfo - Informasi personal untuk validasi (opsional)
   * @returns Promise<void>
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    personalInfo: string[] = []
  ): Promise<void> {
    try {
      // Validasi input
      if (!userId || userId <= 0) {
        throw new ValidationError('User ID tidak valid');
      }

      if (!currentPassword) {
        throw new ValidationError('Password saat ini harus diisi');
      }

      if (!newPassword) {
        throw new ValidationError('Password baru harus diisi');
      }

      // Ambil data user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new ValidationError('User tidak ditemukan');
      }

      // Verifikasi password saat ini
      const isCurrentPasswordValid = await this.passwordHasher.verifyPassword(
        currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        throw new ValidationError('Password saat ini tidak benar');
      }

      // Validasi password baru
      const userPersonalInfo = personalInfo.length > 0 ? personalInfo : [
        user.email || '',
        user.name || ''
      ].filter(Boolean);

      this.passwordValidator.validateWithPersonalInfo(newPassword, userPersonalInfo);

      // Check kekuatan password baru
      const strengthResult = this.strengthChecker.checkPasswordStrength(newPassword);
      if (strengthResult.level === 'weak') {
        throw new ValidationError(
          `Password terlalu lemah. ${strengthResult.feedback.join(', ')}`
        );
      }

      // Pastikan password baru berbeda dari password lama
      const isSamePassword = await this.passwordHasher.verifyPassword(
        newPassword,
        user.password
      );

      if (isSamePassword) {
        throw new ValidationError('Password baru harus berbeda dari password saat ini');
      }

      // Hash password baru
      const hashedNewPassword = await this.passwordHasher.hashPassword(newPassword);

      // Update password di database
      await this.userRepository.updatePassword(userId, hashedNewPassword);

      // Log audit
      if (this.auditLogger) {
        await this.auditLogger.logPasswordChange(userId, 'change', {
          strengthLevel: strengthResult.level,
          strengthScore: strengthResult.score
        });
      }

      console.log(`✅ Password changed successfully for user ${userId}`);
    } catch (error) {
      console.error('❌ Password change failed:', error);
      throw error;
    }
  }

  /**
   * Reset user password tanpa validasi password lama
   * @param userId - ID user
   * @param newPassword - Password baru
   * @param personalInfo - Informasi personal untuk validasi (opsional)
   * @param adminUserId - ID admin yang melakukan reset (opsional)
   * @returns Promise<void>
   */
  async resetPassword(
    userId: number,
    newPassword: string,
    personalInfo: string[] = [],
    adminUserId?: number
  ): Promise<void> {
    try {
      // Validasi input
      if (!userId || userId <= 0) {
        throw new ValidationError('User ID tidak valid');
      }

      if (!newPassword) {
        throw new ValidationError('Password baru harus diisi');
      }

      // Ambil data user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new ValidationError('User tidak ditemukan');
      }

      // Validasi password baru
      const userPersonalInfo = personalInfo.length > 0 ? personalInfo : [
        user.email || '',
        user.name || ''
      ].filter(Boolean);

      this.passwordValidator.validateWithPersonalInfo(newPassword, userPersonalInfo);

      // Check kekuatan password baru
      const strengthResult = this.strengthChecker.checkPasswordStrength(newPassword);
      if (strengthResult.level === 'weak') {
        throw new ValidationError(
          `Password terlalu lemah. ${strengthResult.feedback.join(', ')}`
        );
      }

      // Hash password baru
      const hashedNewPassword = await this.passwordHasher.hashPassword(newPassword);

      // Update password di database
      await this.userRepository.updatePassword(userId, hashedNewPassword);

      // Log audit
      if (this.auditLogger) {
        await this.auditLogger.logPasswordChange(userId, 'reset', {
          strengthLevel: strengthResult.level,
          strengthScore: strengthResult.score,
          adminUserId: adminUserId
        });
      }

      console.log(`✅ Password reset successfully for user ${userId}`);
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      throw error;
    }
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
    strengthResult: any;
  }> {
    const errors: string[] = [];
    let isValid = true;

    try {
      // Validasi format dan kompleksitas
      this.passwordValidator.validateWithPersonalInfo(newPassword, personalInfo);
    } catch (error) {
      isValid = false;
      if (error instanceof ValidationError) {
        errors.push(error.message);
      }
    }

    // Analisis kekuatan
    const strengthResult = this.strengthChecker.checkPasswordStrength(newPassword);
    
    if (strengthResult.level === 'weak') {
      isValid = false;
      errors.push('Password terlalu lemah');
      errors.push(...strengthResult.feedback);
    }

    return {
      isValid,
      errors,
      strengthResult
    };
  }

  /**
   * Generate password baru yang aman untuk user
   * @param length - Panjang password (default: 12)
   * @param personalInfo - Informasi personal untuk memastikan tidak ada konflik
   * @returns string - Password yang aman
   */
  async generateSecurePasswordForUser(
    length: number = 12,
    personalInfo: string[] = []
  ): Promise<string> {
    const { PasswordGenerator } = await import('./passwordGenerator');
    const generator = new PasswordGenerator();
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const password = generator.generateSecurePassword(length);
      
      // Validasi bahwa password tidak mengandung informasi personal
      if (!this.passwordValidator.containsPersonalInfo(password, personalInfo)) {
        const strengthResult = this.strengthChecker.checkPasswordStrength(password);
        if (strengthResult.level !== 'weak') {
          return password;
        }
      }
      
      attempts++;
    }
    
    throw new Error('Gagal menghasilkan password yang aman setelah beberapa percobaan');
  }
}

/**
 * Factory function untuk membuat PasswordManager dengan dependencies default
 * @param userRepository - Repository untuk operasi user
 * @param auditLogger - Logger untuk audit (opsional)
 * @returns PasswordManager instance
 */
export function createPasswordManager(
  userRepository: UserPasswordRepository,
  auditLogger?: PasswordAuditLogger
): PasswordManager {
  const { passwordHasher } = require('./passwordHasher');
  const { passwordValidator } = require('./passwordValidator');
  const { passwordStrengthChecker } = require('./passwordStrengthChecker');
  
  return new PasswordManager(
    userRepository,
    passwordHasher,
    passwordValidator,
    passwordStrengthChecker,
    auditLogger
  );
}