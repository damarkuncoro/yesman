import { roleRepository, featureRepository, roleFeatureRepository } from "@/repositories";
import { type RoleFeature } from "@/db/schema";
import { setPermissionSchema, RBACError } from "./types";
import { z } from "zod";

/**
 * Service untuk manajemen role-feature permissions
 * Menangani operasi CRUD untuk permission antara role dan feature
 */
export class RoleFeatureService {
  /**
   * Set permission untuk role-feature
   * @param permissionData - Data permission role-feature
   * @returns Promise<RoleFeature> - RoleFeature yang dibuat/diupdate
   * @throws RBACError jika role/feature tidak ditemukan
   */
  async setPermission(permissionData: z.infer<typeof setPermissionSchema> | any): Promise<RoleFeature> {
    // Mapping field permissions dari snake_case (frontend) ke camelCase (database)
    const mappedData: any = { ...permissionData };
    if ('can_create' in permissionData) {
      mappedData.canCreate = permissionData.can_create;
      delete mappedData.can_create;
    }
    if ('can_read' in permissionData) {
      mappedData.canRead = permissionData.can_read;
      delete mappedData.can_read;
    }
    if ('can_update' in permissionData) {
      mappedData.canUpdate = permissionData.can_update;
      delete mappedData.can_update;
    }
    if ('can_delete' in permissionData) {
      mappedData.canDelete = permissionData.can_delete;
      delete mappedData.can_delete;
    }
    
    console.log('RoleFeatureService.setPermission - Original data:', permissionData);
    console.log('RoleFeatureService.setPermission - Mapped data:', mappedData);
    
    // Validasi input
    const validatedData = setPermissionSchema.parse(mappedData);
    
    // Cek apakah role ada
    const role = await roleRepository.findById(validatedData.roleId);
    if (!role) {
      throw new RBACError(`Role dengan ID ${validatedData.roleId} tidak ditemukan`);
    }
    
    // Cek apakah feature ada
    const feature = await featureRepository.findById(validatedData.featureId);
    if (!feature) {
      throw new RBACError(`Feature dengan ID ${validatedData.featureId} tidak ditemukan`);
    }

    // Cek apakah permission sudah ada
    const existingPermission = await roleFeatureRepository.findByRoleAndFeature(validatedData.roleId, validatedData.featureId);
    
    if (existingPermission) {
      const updatedPermission = await roleFeatureRepository.update(existingPermission.id, {
        canCreate: validatedData.canCreate,
        canRead: validatedData.canRead,
        canUpdate: validatedData.canUpdate,
        canDelete: validatedData.canDelete,
      });
      
      if (!updatedPermission) {
        throw new RBACError(`Gagal mengupdate permission untuk role ${validatedData.roleId} dan feature ${validatedData.featureId}`);
      }
      
      return updatedPermission;
    } else {
      return await roleFeatureRepository.create({
        roleId: validatedData.roleId,
        featureId: validatedData.featureId,
        canCreate: validatedData.canCreate,
        canRead: validatedData.canRead,
        canUpdate: validatedData.canUpdate,
        canDelete: validatedData.canDelete,
      });
    }
  }

  /**
   * Remove permission untuk role-feature
   * @param roleId - ID role
   * @param featureId - ID feature
   * @returns Promise<boolean> - true jika berhasil dihapus
   * @throws RBACError jika role/feature tidak ditemukan
   */
  async removePermission(roleId: number, featureId: number): Promise<boolean> {
    // Cek apakah role ada
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new RBACError(`Role dengan ID ${roleId} tidak ditemukan`);
    }
    
    // Cek apakah feature ada
    const feature = await featureRepository.findById(featureId);
    if (!feature) {
      throw new RBACError(`Feature dengan ID ${featureId} tidak ditemukan`);
    }

    const permission = await roleFeatureRepository.findByRoleAndFeature(roleId, featureId);
    if (!permission) {
      throw new RBACError('Permission tidak ditemukan');
    }
    return await roleFeatureRepository.delete(permission.id);
  }

  /**
   * Mengambil semua permission untuk role tertentu
   * @param roleId - ID role
   * @returns Promise<RoleFeature[]> - Array permission role
   * @throws RBACError jika role tidak ditemukan
   */
  async getRolePermissions(roleId: number): Promise<RoleFeature[]> {
    // Cek apakah role ada
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new RBACError(`Role dengan ID ${roleId} tidak ditemukan`);
    }

    return await roleFeatureRepository.findByRoleId(roleId);
  }

  /**
   * Mengambil permission untuk role-feature tertentu
   * @param roleId - ID role
   * @param featureId - ID feature
   * @returns Promise<RoleFeature | null> - Permission jika ditemukan
   */
  async getPermission(roleId: number, featureId: number): Promise<RoleFeature | null> {
    const permission = await roleFeatureRepository.findByRoleAndFeature(roleId, featureId);
    return permission || null;
  }

  /**
   * Mengambil semua permission untuk role tertentu dengan detail feature
   * @param roleId - ID role
   * @returns Promise<any[]> - Array permission role dengan detail feature
   * @throws RBACError jika role tidak ditemukan
   */
  async getRolePermissionsWithFeatures(roleId: number): Promise<any[]> {
    // Cek apakah role ada
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new RBACError(`Role dengan ID ${roleId} tidak ditemukan`);
    }

    return await roleFeatureRepository.findByRoleIdWithFeatures(roleId);
  }
}

// Export instance untuk digunakan di aplikasi
export const roleFeatureService = new RoleFeatureService();