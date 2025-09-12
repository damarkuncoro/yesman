// Re-export types
export * from './types';

// Re-export services
export { UserCrudService, userCrudService } from './userCrudService';
export { UserProfileService, userProfileService } from './userProfileService';
export { UserRoleAssignmentService, userRoleAssignmentService } from './userRoleAssignmentService';

// Import services untuk backward compatibility
import { userCrudService } from './userCrudService';
import { userProfileService } from './userProfileService';
import { userRoleAssignmentService } from './userRoleAssignmentService';
import type { User, UserCreateInput, SanitizedUser } from './types';

/**
 * UserService yang menggabungkan semua service kecil
 * Menyediakan backward compatibility dengan interface yang sama seperti sebelumnya
 * Menerapkan Facade Pattern untuk menyembunyikan kompleksitas service-service kecil
 */
export class UserService {
  // Implementasi method dari BaseCrudService untuk backward compatibility
  async getAll(): Promise<User[]> {
    return userCrudService.getAll();
  }

  async getById(id: number): Promise<User | null> {
    return userCrudService.getById(id);
  }

  async create(data: UserCreateInput): Promise<User> {
    return this.createUser(data);
  }

  async update(id: number, data: Partial<UserCreateInput>): Promise<User | null> {
    return userCrudService.update(id, data);
  }

  async delete(id: number): Promise<boolean> {
    return userCrudService.delete(id);
  }

  // Method yang sudah ada sebelumnya
  async getActiveUsers(): Promise<User[]> {
    return userCrudService.getActiveUsers();
  }

  async getUserById(id: number): Promise<User | null> {
    return userCrudService.getById(id);
  }

  /**
   * Membuat user baru dengan auto-assign role
   * @param userData - Data user untuk dibuat
   * @returns Promise<User> - User yang berhasil dibuat
   */
  async createUser(userData: UserCreateInput): Promise<User> {
    // Buat user menggunakan CRUD service
    const newUser = await userCrudService.create(userData);
    
    // Auto-assign role menggunakan role assignment service
    await userRoleAssignmentService.assignDefaultRole(newUser.id);
    
    return newUser;
  }

  /**
   * Update user profile
   * @param userId - ID user
   * @param updateData - Data yang akan diupdate
   * @returns Promise<SanitizedUser | null> - User yang sudah diupdate
   */
  async updateUserProfile(
    userId: number, 
    updateData: { name?: string; email?: string }
  ): Promise<SanitizedUser | null> {
    return userProfileService.updateUserProfile(userId, updateData);
  }

  /**
   * Deaktivasi user
   * @param userId - ID user yang akan dinonaktifkan
   * @returns Promise<boolean> - true jika berhasil dinonaktifkan
   */
  async deactivateUser(userId: number): Promise<boolean> {
    const result = await userCrudService.deactivateUser(userId);
    if (result) {
      // Session management dipindah ke AuthService
      console.log('Session management handled by AuthService');
      return true;
    }
    return false;
  }

  // Method tambahan yang menggunakan service-service kecil
  async getUserProfile(userId: number): Promise<SanitizedUser | null> {
    return userProfileService.getUserProfile(userId);
  }

  async getUserProfileByEmail(email: string): Promise<SanitizedUser | null> {
    return userProfileService.getUserProfileByEmail(email);
  }

  async updateUserDepartment(userId: number, department: string): Promise<SanitizedUser | null> {
    return userProfileService.updateUserDepartment(userId, department);
  }

  async updateUserRegion(userId: number, region: string): Promise<SanitizedUser | null> {
    return userProfileService.updateUserRegion(userId, region);
  }

  async updateUserLevel(userId: number, level: number): Promise<SanitizedUser | null> {
    return userProfileService.updateUserLevel(userId, level);
  }

  async assignRoleByName(userId: number, roleName: string): Promise<boolean> {
    return userRoleAssignmentService.assignRoleByName(userId, roleName);
  }

  async removeRoleByName(userId: number, roleName: string): Promise<boolean> {
    return userRoleAssignmentService.removeRoleByName(userId, roleName);
  }

  async getUserRoles(userId: number): Promise<string[]> {
    return userRoleAssignmentService.getUserRoles(userId);
  }

  async getByEmail(email: string): Promise<User | null> {
    return userCrudService.getByEmail(email);
  }

  async count(): Promise<number> {
    return userCrudService.count();
  }
}

// Export instance untuk backward compatibility
export const userService = new UserService();