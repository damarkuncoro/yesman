import { roleRepository, userRoleRepository } from "@/repositories";
import { 
  type Role,
  type CreateRoleInput,
  createRoleSchema,
  RoleNotFoundError,
  DuplicateRoleError,
  RBACError
} from "./types";

/**
 * Service untuk manajemen Role dalam sistem RBAC
 * Menangani business logic untuk operasi role
 */
export class RoleService {
  /**
   * Mengambil semua role
   * @returns Promise<Role[]> - Array semua role
   */
  async getAllRoles(): Promise<Role[]> {
    return await roleRepository.findAll();
  }

  /**
   * Mengambil role berdasarkan ID
   * @param id - ID role
   * @returns Promise<Role> - Role yang ditemukan
   * @throws RoleNotFoundError jika role tidak ditemukan
   */
  async getRoleById(id: number): Promise<Role> {
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new RoleNotFoundError(id);
    }
    return role;
  }

  /**
   * Membuat role baru
   * @param roleData - Data role yang akan dibuat
   * @returns Promise<Role> - Role yang baru dibuat
   * @throws DuplicateRoleError jika nama role sudah ada
   */
  async createRole(roleData: CreateRoleInput): Promise<Role> {
    // Validasi input
    const validatedData = createRoleSchema.parse(roleData);
    
    // Cek apakah nama role sudah ada
    const existingRole = await roleRepository.findByName(validatedData.name);
    if (existingRole) {
      throw new DuplicateRoleError(validatedData.name);
    }

    return await roleRepository.create(validatedData);
  }

  /**
   * Update role
   * @param id - ID role yang akan diupdate
   * @param roleData - Data role yang akan diupdate
   * @returns Promise<Role> - Role yang sudah diupdate
   * @throws RoleNotFoundError jika role tidak ditemukan
   * @throws DuplicateRoleError jika nama sudah ada
   */
  async updateRole(id: number, roleData: Partial<CreateRoleInput & { grants_all?: boolean; features?: any[] }>): Promise<Role> {
    // Cek apakah role ada
    const existingRole = await this.getRoleById(id);
    
    // Jika mengupdate nama, cek apakah nama baru sudah ada
    if (roleData.name && roleData.name !== existingRole.name) {
      const roleWithSameName = await roleRepository.findByName(roleData.name);
      if (roleWithSameName) {
        throw new DuplicateRoleError(roleData.name);
      }
    }

    // Mapping field grants_all (snake_case dari frontend) ke grantsAll (camelCase untuk database)
    const mappedRoleData: any = { ...roleData };
    if ('grants_all' in roleData) {
      mappedRoleData.grantsAll = roleData.grants_all;
      delete mappedRoleData.grants_all;
    }
    
    // Handle features array - hapus dari mappedRoleData karena tidak disimpan di tabel roles
    const featuresArray = roleData.features;
    if ('features' in mappedRoleData) {
      delete mappedRoleData.features;
    }

    console.log('RoleService.updateRole - Original data:', roleData);
    console.log('RoleService.updateRole - Mapped data:', mappedRoleData);
    console.log('RoleService.updateRole - Features array:', featuresArray);

    const updatedRole = await roleRepository.update(id, mappedRoleData);
    if (!updatedRole) {
      throw new RBACError(`Gagal mengupdate role dengan ID ${id}`);
    }
    
    // Proses features array jika ada
    if (featuresArray && Array.isArray(featuresArray)) {
      const { roleFeatureService } = await import('./roleFeatureService');
      
      for (const feature of featuresArray) {
        console.log('Processing feature:', feature);
        await roleFeatureService.setPermission({
          roleId: id,
          featureId: feature.feature_id,
          can_create: feature.can_create,
          can_read: feature.can_read,
          can_update: feature.can_update,
          can_delete: feature.can_delete
        });
      }
    }
    
    return updatedRole;
  }

  /**
   * Hapus role
   * @param id - ID role yang akan dihapus
   * @returns Promise<boolean> - true jika berhasil dihapus
   * @throws RoleNotFoundError jika role tidak ditemukan
   * @throws RBACError jika role masih digunakan
   */
  async deleteRole(id: number): Promise<boolean> {
    // Cek apakah role ada
    await this.getRoleById(id);
    
    // Cek apakah role masih digunakan oleh user
    const usersWithRole = await userRoleRepository.findByRoleId(id);
    if (usersWithRole.length > 0) {
      throw new RBACError(`Role tidak dapat dihapus karena masih digunakan oleh ${usersWithRole.length} user`);
    }

    return await roleRepository.delete(id);
  }

  /**
   * Mencari role berdasarkan nama
   * @param name - Nama role
   * @returns Promise<Role | undefined> - Role yang ditemukan atau undefined
   */
  async findRoleByName(name: string): Promise<Role | undefined> {
    return await roleRepository.findByName(name);
  }

  /**
   * Mengecek apakah role dengan nama tertentu sudah ada
   * @param name - Nama role
   * @returns Promise<boolean> - true jika role sudah ada
   */
  async roleExists(name: string): Promise<boolean> {
    const role = await this.findRoleByName(name);
    return role !== null;
  }
}

// Export instance untuk digunakan di aplikasi
export const roleService = new RoleService();