import { userRepository, roleRepository, userRoleRepository } from "@/repositories";
import { 
  type Role,
  type UserRole,
  type AssignRoleInput,
  assignRoleSchema,
  UserNotFoundError,
  RoleNotFoundError,
  RoleAssignmentExistsError,
  RBACError
} from "./types";

/**
 * Service untuk manajemen User-Role assignments dalam sistem RBAC
 * Menangani business logic untuk operasi assignment role ke user
 */
export class UserRoleService {
  /**
   * Assign role ke user
   * @param assignData - Data assignment role ke user
   * @returns Promise<UserRole> - UserRole yang baru dibuat
   * @throws UserNotFoundError jika user tidak ditemukan
   * @throws RoleNotFoundError jika role tidak ditemukan
   * @throws RoleAssignmentExistsError jika user sudah memiliki role
   */
  async assignRole(assignData: AssignRoleInput): Promise<UserRole> {
    // Validasi input
    const validatedData = assignRoleSchema.parse(assignData);
    
    // Cek apakah user ada
    const user = await userRepository.findById(validatedData.userId);
    if (!user) {
      throw new UserNotFoundError(validatedData.userId);
    }
    
    // Cek apakah role ada
    const role = await roleRepository.findById(validatedData.roleId);
    if (!role) {
      throw new RoleNotFoundError(validatedData.roleId);
    }
    
    // Cek apakah user sudah memiliki role ini
    const hasRole = await userRoleRepository.userHasRole(validatedData.userId, validatedData.roleId);
    if (hasRole) {
      throw new RoleAssignmentExistsError(validatedData.userId, validatedData.roleId);
    }

    // Update rolesUpdatedAt untuk invalidasi session
    await userRepository.update(validatedData.userId, {
      rolesUpdatedAt: new Date(),
    });

    return await userRoleRepository.create({
      userId: validatedData.userId,
      roleId: validatedData.roleId
    });
  }

  /**
   * Remove role dari user
   * @param userId - ID user
   * @param roleId - ID role
   * @returns Promise<boolean> - true jika berhasil dihapus
   * @throws UserNotFoundError jika user tidak ditemukan
   * @throws RoleNotFoundError jika role tidak ditemukan
   * @throws RBACError jika user tidak memiliki role
   */
  async removeRole(userId: number, roleId: number): Promise<boolean> {
    // Cek apakah user ada
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }
    
    // Cek apakah role ada
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new RoleNotFoundError(roleId);
    }
    
    // Cek apakah user memiliki role ini
    const hasRole = await userRoleRepository.userHasRole(userId, roleId);
    if (!hasRole) {
      throw new RBACError(`User tidak memiliki role '${role.name}'`);
    }

    // Update rolesUpdatedAt untuk invalidasi session
    await userRepository.update(userId, {
      rolesUpdatedAt: new Date(),
    });

    return await userRoleRepository.deleteByUserAndRole(userId, roleId);
  }

  /**
   * Mengambil semua role untuk user tertentu
   * @param userId - ID user
   * @returns Promise<(UserRole & { role: Role })[]> - Array UserRole dengan relasi role
   * @throws UserNotFoundError jika user tidak ditemukan
   */
  async getUserRoles(userId: number): Promise<(UserRole & { role: Role })[]> {
    // Cek apakah user ada
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const userRoles = await userRoleRepository.findByUserId(userId);
    const result = [];
    
    for (const userRole of userRoles) {
      const role = await roleRepository.findById(userRole.roleId);
      if (role) {
        result.push({ ...userRole, role });
      }
    }
    
    return result;
  }

  /**
   * Mengambil semua user untuk role tertentu
   * @param roleId - ID role
   * @returns Promise<UserRole[]> - Array UserRole yang memiliki role
   * @throws RoleNotFoundError jika role tidak ditemukan
   */
  async getRoleUsers(roleId: number): Promise<UserRole[]> {
    // Cek apakah role ada
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new RoleNotFoundError(roleId);
    }

    return await userRoleRepository.findByRoleId(roleId);
  }

  /**
   * Mengecek apakah user memiliki role tertentu
   * @param userId - ID user
   * @param roleId - ID role
   * @returns Promise<boolean> - true jika user memiliki role
   */
  async userHasRole(userId: number, roleId: number): Promise<boolean> {
    return await userRoleRepository.userHasRole(userId, roleId);
  }

  /**
   * Mengecek apakah user memiliki role dengan nama tertentu
   * @param userId - ID user
   * @param roleName - Nama role
   * @returns Promise<boolean> - true jika user memiliki role
   */
  async userHasRoleByName(userId: number, roleName: string): Promise<boolean> {
    const role = await roleRepository.findByName(roleName);
    if (!role) {
      return false;
    }
    return await this.userHasRole(userId, role.id);
  }

  /**
   * Remove semua role dari user
   * @param userId - ID user
   * @returns Promise<number> - jumlah role yang dihapus
   * @throws UserNotFoundError jika user tidak ditemukan
   */
  async removeAllUserRoles(userId: number): Promise<number> {
    // Cek apakah user ada
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // Ambil semua role user terlebih dahulu
    const userRoles = await userRoleRepository.findByUserId(userId);
    
    // Update rolesUpdatedAt untuk invalidasi session
    await userRepository.update(userId, {
      rolesUpdatedAt: new Date(),
    });

    // Hapus satu per satu
    let deletedCount = 0;
    for (const userRole of userRoles) {
      const deleted = await userRoleRepository.deleteByUserAndRole(userId, userRole.roleId);
      if (deleted) deletedCount++;
    }

    return deletedCount;
  }
}

// Export instance untuk digunakan di aplikasi
export const userRoleService = new UserRoleService();