import { userRepository, userRoleRepository, roleRepository } from "@/repositories";
import { NotFoundError } from "@/lib/errors/errorHandler";

/**
 * User Role Assignment Service yang menangani assignment role untuk user
 * Menerapkan Single Responsibility Principle - hanya menangani role assignment
 */
export class UserRoleAssignmentService {
  /**
   * Assign default role ke user baru
   * Business rules:
   * - User pertama di sistem mendapat role Administrator
   * - User selanjutnya mendapat role default 'user'
   * @param userId - ID user
   * @returns Promise<void>
   */
  async assignDefaultRole(userId: number): Promise<void> {
    try {
      // Validasi user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      // Cek apakah ini user pertama di sistem
      const totalUsers = await userRepository.count();
      
      if (totalUsers === 1) {
        // User pertama mendapat role Administrator
        await this.assignAdminRole(userId);
      } else {
        // User selanjutnya mendapat role default 'user'
        await this.assignUserRole(userId);
      }
    } catch (error) {
      console.error('Error saat assign role default:', error);
      // Tidak throw error karena user sudah berhasil dibuat
      // Role assignment adalah operasi sekunder
    }
  }

  /**
   * Assign role Administrator ke user
   * @param userId - ID user
   * @returns Promise<void>
   */
  async assignAdminRole(userId: number): Promise<void> {
    try {
      const adminRole = await roleRepository.findByName('administrator');
      if (adminRole) {
        await userRoleRepository.create({
          userId: userId,
          roleId: adminRole.id
        });
        console.log(`Role Administrator assigned to user ${userId}`);
      } else {
        console.warn('Role Administrator tidak ditemukan');
      }
    } catch (error) {
      console.error('Error assigning admin role:', error);
      throw error;
    }
  }

  /**
   * Assign role User ke user
   * @param userId - ID user
   * @returns Promise<void>
   */
  async assignUserRole(userId: number): Promise<void> {
    try {
      const userRole = await roleRepository.findByName('user');
      if (userRole) {
        await userRoleRepository.create({
          userId: userId,
          roleId: userRole.id
        });
        console.log(`Role User assigned to user ${userId}`);
      } else {
        console.warn('Role User tidak ditemukan');
      }
    } catch (error) {
      console.error('Error assigning user role:', error);
      throw error;
    }
  }

  /**
   * Assign role custom ke user
   * @param userId - ID user
   * @param roleName - Nama role
   * @returns Promise<boolean> - true jika berhasil assign
   */
  async assignRoleByName(userId: number, roleName: string): Promise<boolean> {
    try {
      // Validasi user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      // Cari role berdasarkan nama
      const role = await roleRepository.findByName(roleName);
      if (!role) {
        throw new NotFoundError('Role', roleName);
      }

      // Cek apakah user sudah memiliki role ini
      const existingUserRole = await userRoleRepository.findByUserAndRole(userId, role.id);
      if (existingUserRole) {
        console.log(`User ${userId} sudah memiliki role ${roleName}`);
        return true;
      }

      // Assign role
      await userRoleRepository.create({
        userId: userId,
        roleId: role.id
      });

      console.log(`Role ${roleName} assigned to user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error assigning role by name:', error);
      throw error;
    }
  }

  /**
   * Remove role dari user
   * @param userId - ID user
   * @param roleName - Nama role
   * @returns Promise<boolean> - true jika berhasil remove
   */
  async removeRoleByName(userId: number, roleName: string): Promise<boolean> {
    try {
      // Validasi user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      // Cari role berdasarkan nama
      const role = await roleRepository.findByName(roleName);
      if (!role) {
        throw new NotFoundError('Role', roleName);
      }

      // Cari user role
      const userRole = await userRoleRepository.findByUserAndRole(userId, role.id);
      if (!userRole) {
        console.log(`User ${userId} tidak memiliki role ${roleName}`);
        return true;
      }

      // Remove role
      await userRoleRepository.delete(userRole.id);
      console.log(`Role ${roleName} removed from user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error removing role by name:', error);
      throw error;
    }
  }

  /**
   * Mendapatkan semua role user
   * @param userId - ID user
   * @returns Promise<string[]> - Array nama role
   */
  async getUserRoles(userId: number): Promise<string[]> {
    try {
      // Validasi user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      // Ambil semua user roles
      const userRoles = await userRoleRepository.findByUserId(userId);
      const roleNames: string[] = [];

      for (const userRole of userRoles) {
        const role = await roleRepository.findById(userRole.roleId);
        if (role) {
          roleNames.push(role.name);
        }
      }

      return roleNames;
    } catch (error) {
      console.error('Error getting user roles:', error);
      throw error;
    }
  }
}

// Export instance untuk digunakan di service lain
export const userRoleAssignmentService = new UserRoleAssignmentService();