import { userRepository } from "@/repositories";
import { NotFoundError, ConflictError } from "@/lib/errors/errorHandler";
import { z } from "zod";
import type { User, UserProfileUpdateData, SanitizedUser } from "./types";

/**
 * User Profile Service yang menangani operasi profile management
 * Menerapkan Single Responsibility Principle - hanya menangani profile user
 */
export class UserProfileService {
  /**
   * Update user profile
   * @param userId - ID user
   * @param updateData - Data yang akan diupdate
   * @returns Promise<SanitizedUser | null> - User yang sudah diupdate (tanpa password hash)
   */
  async updateUserProfile(
    userId: number, 
    updateData: UserProfileUpdateData
  ): Promise<SanitizedUser | null> {
    try {
      // Validasi input
      const updateSchema = z.object({
        name: z.string().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter").optional(),
        email: z.string().email("Format email tidak valid").optional(),
      });

      const validatedData = updateSchema.parse(updateData);

      // Cek apakah user ada
      const existingUser = await userRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundError('User', userId);
      }

      // Jika email diubah, cek apakah email baru sudah ada
      if (validatedData.email) {
        const userWithEmail = await userRepository.findByEmail(validatedData.email);
        if (userWithEmail && userWithEmail.id !== userId) {
          throw new ConflictError('User', 'email', validatedData.email);
        }
      }

      // Update user
      const updatedUser = await userRepository.update(userId, validatedData);
      return updatedUser ? this.sanitizeUser(updatedUser) : null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.issues.map((e: z.ZodIssue) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Mendapatkan profile user (tanpa password hash)
   * @param userId - ID user
   * @returns Promise<SanitizedUser | null> - User profile atau null jika tidak ditemukan
   */
  async getUserProfile(userId: number): Promise<SanitizedUser | null> {
    try {
      const user = await userRepository.findById(userId);
      return user ? this.sanitizeUser(user) : null;
    } catch (error) {
      throw new Error(`Error getting user profile: ${error}`);
    }
  }

  /**
   * Mendapatkan profile user berdasarkan email (tanpa password hash)
   * @param email - Email user
   * @returns Promise<SanitizedUser | null> - User profile atau null jika tidak ditemukan
   */
  async getUserProfileByEmail(email: string): Promise<SanitizedUser | null> {
    try {
      const user = await userRepository.findByEmail(email);
      return user ? this.sanitizeUser(user) : null;
    } catch (error) {
      throw new Error(`Error getting user profile by email: ${error}`);
    }
  }

  /**
   * Update department user
   * @param userId - ID user
   * @param department - Department baru
   * @returns Promise<SanitizedUser | null> - User yang sudah diupdate
   */
  async updateUserDepartment(userId: number, department: string): Promise<SanitizedUser | null> {
    try {
      const existingUser = await userRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundError('User', userId);
      }

      const updatedUser = await userRepository.update(userId, { department });
      return updatedUser ? this.sanitizeUser(updatedUser) : null;
    } catch (error) {
      throw new Error(`Error updating user department: ${error}`);
    }
  }

  /**
   * Update region user
   * @param userId - ID user
   * @param region - Region baru
   * @returns Promise<SanitizedUser | null> - User yang sudah diupdate
   */
  async updateUserRegion(userId: number, region: string): Promise<SanitizedUser | null> {
    try {
      const existingUser = await userRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundError('User', userId);
      }

      const updatedUser = await userRepository.update(userId, { region });
      return updatedUser ? this.sanitizeUser(updatedUser) : null;
    } catch (error) {
      throw new Error(`Error updating user region: ${error}`);
    }
  }

  /**
   * Update level user
   * @param userId - ID user
   * @param level - Level baru
   * @returns Promise<SanitizedUser | null> - User yang sudah diupdate
   */
  async updateUserLevel(userId: number, level: number): Promise<SanitizedUser | null> {
    try {
      const existingUser = await userRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundError('User', userId);
      }

      const updatedUser = await userRepository.update(userId, { level });
      return updatedUser ? this.sanitizeUser(updatedUser) : null;
    } catch (error) {
      throw new Error(`Error updating user level: ${error}`);
    }
  }

  /**
   * Menghapus password hash dari user object
   * @param user - User object
   * @returns User tanpa password hash
   */
  private sanitizeUser(user: User): SanitizedUser {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

// Export instance untuk digunakan di service lain
export const userProfileService = new UserProfileService();