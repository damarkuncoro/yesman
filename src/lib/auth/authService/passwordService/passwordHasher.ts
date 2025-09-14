import bcrypt from "bcryptjs";
import { ValidationError } from "../../../errors/errorHandler";

/**
 * PasswordHasher
 * Bertanggung jawab untuk hashing dan verifikasi password
 * Mengikuti Single Responsibility Principle
 */
export class PasswordHasher {
  private readonly SALT_ROUNDS = 12;

  /**
   * Hash password menggunakan bcrypt
   * @param password - Password plain text yang sudah divalidasi
   * @returns Promise<string> - Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    try {
      if (!password) {
        throw new ValidationError('Password tidak boleh kosong untuk hashing');
      }
      
      return await bcrypt.hash(password, this.SALT_ROUNDS);
    } catch (error) {
      console.error('❌ Password hashing failed:', error);
      throw error;
    }
  }

  /**
   * Verifikasi password dengan hash yang tersimpan
   * @param password - Password plain text
   * @param hashedPassword - Hashed password dari database
   * @returns Promise<boolean> - true jika password cocok, false jika tidak
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      if (!password || !hashedPassword) {
        return false;
      }
      
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('❌ Password verification failed:', error);
      return false;
    }
  }

  /**
   * Mendapatkan salt rounds yang digunakan
   * @returns number - Jumlah salt rounds
   */
  getSaltRounds(): number {
    return this.SALT_ROUNDS;
  }
}

// Export singleton instance
export const passwordHasher = new PasswordHasher();
export default passwordHasher;