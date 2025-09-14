import { ValidationError } from "../../../errors/errorHandler";

/**
 * PasswordValidator
 * Bertanggung jawab untuk validasi format dan kompleksitas password
 * Mengikuti Single Responsibility Principle
 */
export class PasswordValidator {
  private readonly MIN_PASSWORD_LENGTH = 8;
  private readonly MAX_PASSWORD_LENGTH = 128;

  /**
   * Validasi format password secara lengkap
   * @param password - Password yang akan divalidasi
   * @throws ValidationError jika password tidak valid
   */
  validatePassword(password: string): void {
    this.validateBasicFormat(password);
    this.validateLength(password);
    this.validateComplexity(password);
  }

  /**
   * Validasi format dasar password
   * @param password - Password yang akan divalidasi
   * @throws ValidationError jika format tidak valid
   */
  private validateBasicFormat(password: string): void {
    if (!password) {
      throw new ValidationError('Password harus diisi');
    }

    if (typeof password !== 'string') {
      throw new ValidationError('Password harus berupa string');
    }
  }

  /**
   * Validasi panjang password
   * @param password - Password yang akan divalidasi
   * @throws ValidationError jika panjang tidak sesuai
   */
  private validateLength(password: string): void {
    if (password.length < this.MIN_PASSWORD_LENGTH) {
      throw new ValidationError(`Password minimal ${this.MIN_PASSWORD_LENGTH} karakter`);
    }

    if (password.length > this.MAX_PASSWORD_LENGTH) {
      throw new ValidationError(`Password maksimal ${this.MAX_PASSWORD_LENGTH} karakter`);
    }
  }

  /**
   * Validasi kompleksitas password
   * @param password - Password yang akan divalidasi
   * @throws ValidationError jika password tidak memenuhi kriteria kompleksitas
   */
  private validateComplexity(password: string): void {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const complexityCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
      .filter(Boolean).length;

    if (complexityCount < 3) {
      throw new ValidationError(
        'Password harus mengandung minimal 3 dari: huruf besar, huruf kecil, angka, karakter khusus'
      );
    }
  }

  /**
   * Check apakah password mengandung informasi personal
   * @param password - Password yang akan dicek
   * @param personalInfo - Array informasi personal (nama, email, dll)
   * @returns boolean - true jika mengandung informasi personal
   */
  containsPersonalInfo(password: string, personalInfo: string[]): boolean {
    if (!password || !personalInfo || personalInfo.length === 0) {
      return false;
    }

    const lowerPassword = password.toLowerCase();
    
    return personalInfo.some(info => {
      if (!info || info.length < 3) return false;
      return lowerPassword.includes(info.toLowerCase());
    });
  }

  /**
   * Validasi password dengan informasi personal
   * @param password - Password yang akan divalidasi
   * @param personalInfo - Array informasi personal
   * @throws ValidationError jika password mengandung informasi personal
   */
  validateWithPersonalInfo(password: string, personalInfo: string[]): void {
    this.validatePassword(password);
    
    if (this.containsPersonalInfo(password, personalInfo)) {
      throw new ValidationError('Password tidak boleh mengandung informasi personal');
    }
  }

  /**
   * Mendapatkan konfigurasi panjang password
   * @returns object - Min dan max length
   */
  getPasswordLengthConfig(): { min: number; max: number } {
    return {
      min: this.MIN_PASSWORD_LENGTH,
      max: this.MAX_PASSWORD_LENGTH
    };
  }
}

// Export singleton instance
export const passwordValidator = new PasswordValidator();
export default passwordValidator;