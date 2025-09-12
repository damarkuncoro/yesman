import { type Role, type UserRole } from "@/db/schema";
import { UserPermissionResponse, ActionType, RBACError } from "./types";
import { userRoleService } from "./userRoleService";
import { roleFeatureService } from "./roleFeatureService";
import { featureService } from "./featureService";

/**
 * Service untuk orchestration dan high-level RBAC operations
 * Menangani operasi kompleks yang melibatkan multiple service
 */
export class RBACService {
  /**
   * Mengambil semua role untuk user tertentu
   * @param userId - ID user (string)
   * @returns Promise<(UserRole & { role: Role })[]> - Array role yang dimiliki user
   * @throws RBACError jika userId tidak valid
   */
  async getUserRoles(userId: string): Promise<(UserRole & { role: Role })[]> {
    console.log(`RBACService.getUserRoles called with userId: ${userId}`);
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      console.error(`Invalid userId: ${userId}, parsed as: ${userIdNum}`);
      throw new RBACError('User ID harus berupa angka');
    }
    console.log(`Calling userRoleService.getUserRoles with userIdNum: ${userIdNum}`);
    const result = await userRoleService.getUserRoles(userIdNum);
    console.log(`RBACService.getUserRoles result:`, result);
    return result;
  }

  /**
   * Mengambil semua permissions untuk user tertentu
   * @param userId - ID user (string)
   * @returns Promise<UserPermissionResponse[]> - Array permissions yang dimiliki user
   * @throws RBACError jika userId tidak valid
   */
  async getUserPermissions(userId: string): Promise<UserPermissionResponse[]> {
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      throw new RBACError('User ID harus berupa angka');
    }

    // Ambil semua role user
    const userRoles = await userRoleService.getUserRoles(userIdNum);
    
    // Ambil semua permissions dari role-role tersebut
    const allPermissions: UserPermissionResponse[] = [];
    
    for (const role of userRoles) {
      const rolePermissions = await roleFeatureService.getRolePermissions(role.id);
      
      for (const permission of rolePermissions) {
        // Ambil detail feature
        const feature = await featureService.getFeatureById(permission.featureId);
        
        // Cek apakah permission sudah ada (untuk menghindari duplikasi)
        const existingPermission = allPermissions.find(p => p.featureId === feature.id.toString());
        
        if (!existingPermission && (permission.canRead || permission.canCreate || permission.canUpdate || permission.canDelete)) {
          allPermissions.push({
            featureId: feature.id.toString(),
            featureName: feature.name,
            featureDescription: feature.description || '',
          });
        }
      }
    }
    
    return allPermissions;
  }

  /**
   * Mengecek apakah user memiliki permission untuk feature dan action tertentu
   * @param userId - ID user (string)
   * @param featureName - Nama feature
   * @param action - Action yang diperlukan
   * @returns Promise<boolean> - True jika user memiliki permission
   */
  async checkUserPermission(
    userId: string,
    featureName: string,
    action: ActionType
  ): Promise<boolean> {
    try {
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        throw new RBACError('User ID harus berupa angka');
      }

      // Ambil semua role user
      const userRoles = await userRoleService.getUserRoles(userIdNum);
      
      // Cek apakah ada role dengan grantsAll
      const hasGrantsAll = userRoles.some(userRole => userRole.role.grantsAll);
      if (hasGrantsAll) {
        return true;
      }
      
      // Ambil semua feature untuk mencari feature berdasarkan nama
      const allFeatures = await featureService.getAllFeatures();
      const targetFeature = allFeatures.find(f => f.name === featureName);
      
      if (!targetFeature) {
        console.log(`Feature '${featureName}' tidak ditemukan`);
        return false;
      }
      
      // Cek permission di setiap role
      for (const userRole of userRoles) {
        const permission = await roleFeatureService.getPermission(userRole.role.id, targetFeature.id);
        
        if (permission) {
          // Cek action spesifik
          switch (action) {
            case "create":
              if (permission.canCreate) return true;
              break;
            case "read":
              if (permission.canRead) return true;
              break;
            case "update":
              if (permission.canUpdate) return true;
              break;
            case "delete":
              if (permission.canDelete) return true;
              break;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking user permission:', error);
      return false;
    }
  }
}

// Export instance untuk digunakan di aplikasi
export const rbacService = new RBACService();