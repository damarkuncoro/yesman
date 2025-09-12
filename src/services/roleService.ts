import { BaseCrudService } from "./base/baseService";
import { ValidationService } from "../lib/validation/validator";
import { errorUtils, NotFoundError, ConflictError } from "../lib/errors/errorHandler";
import { roleCreateSchema, roleUpdateSchema, multipleIdsSchema, paginationSchema, searchWithPaginationSchema } from "../lib/validation/schemas";
import { RoleRepository } from "../repositories/role/roleRepository";
import type { Role } from "../db/schema";
import type { RoleCreateInput, RoleUpdateInput } from "../lib/validation/schemas";

/**
 * Role service yang mengextend BaseCrudService
 * Menerapkan Single Responsibility Principle untuk role management
 */
export class RoleService extends BaseCrudService<Role, RoleCreateInput, RoleUpdateInput> {
  constructor(private roleRepository: RoleRepository) {
    super();
  }

  /**
   * Get semua roles
   * @returns Array of roles
   */
  async getAll(): Promise<Role[]> {
    return this.executeWithErrorHandling(
      'get all roles',
      () => this.roleRepository.findAll()
    );
  }

  /**
   * Get role by ID
   * @param id - Role ID
   * @returns Role atau null jika tidak ditemukan
   */
  async getById(id: number): Promise<Role | null> {
    return this.executeWithErrorHandling(
      'get role by id',
      async () => {
        const role = await this.roleRepository.findById(id);
        return role || null;
      }
    );
  }

  /**
   * Get role by ID dengan validasi exists
   * @param id - Role ID
   * @returns Role
   * @throws NotFoundError jika role tidak ditemukan
   */
  async getByIdOrThrow(id: number): Promise<Role> {
    const role = await this.getById(id);
    if (!role) {
      throw errorUtils.notFound('Role', id);
    }
    return role;
  }

  /**
   * Get role by name
   * @param name - Role name
   * @returns Role atau null jika tidak ditemukan
   */
  async getByName(name: string): Promise<Role | null> {
    return this.executeWithErrorHandling(
      'get role by name',
      async () => {
        const role = await this.roleRepository.findByName(name);
        return role || null;
      }
    );
  }

  /**
   * Create role baru
   * @param data - Data role yang akan dibuat
   * @returns Role yang dibuat
   * @throws ValidationError jika data tidak valid
   * @throws ConflictError jika role dengan name yang sama sudah ada
   */
  async create(data: unknown): Promise<Role> {
    // Validasi input
    const validatedData = ValidationService.validate(roleCreateSchema, data);

    // Check apakah role dengan name yang sama sudah ada
    const existingRole = await this.getByName(validatedData.name);
    if (existingRole) {
      throw errorUtils.conflict('Role', 'name', validatedData.name);
    }

    return this.executeWithErrorHandling(
      'create role',
      () => this.roleRepository.create(validatedData)
    );
  }

  /**
   * Update role
   * @param id - Role ID
   * @param data - Data yang akan diupdate
   * @returns Role yang diupdate
   * @throws ValidationError jika data tidak valid
   * @throws NotFoundError jika role tidak ditemukan
   * @throws ConflictError jika name sudah digunakan role lain
   */
  async update(id: number, data: unknown): Promise<Role> {
    // Validasi input
    const validatedData = ValidationService.validate(roleUpdateSchema, data);

    // Check apakah role exists
    await this.getByIdOrThrow(id);

    // Jika ada perubahan name, check conflict
    if (validatedData.name) {
      const existingRole = await this.getByName(validatedData.name);
      if (existingRole && existingRole.id !== id) {
        throw errorUtils.conflict('Role', 'name', validatedData.name);
      }
    }

    const updatedRole = await this.executeWithErrorHandling(
      'update role',
      () => this.roleRepository.update(id, validatedData)
    );

    if (!updatedRole) {
      throw errorUtils.notFound('Role', id);
    }

    return updatedRole;
  }

  /**
   * Delete role
   * @param id - Role ID
   * @returns true jika berhasil dihapus
   * @throws NotFoundError jika role tidak ditemukan
   */
  async delete(id: number): Promise<boolean> {
    // Check apakah role exists
    await this.getByIdOrThrow(id);

    return this.executeWithErrorHandling(
      'delete role',
      () => this.roleRepository.delete(id)
    );
  }

  /**
   * Get roles dengan pagination
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated roles
   */
  async getPaginated(page: number = 1, limit: number = 10): Promise<{
    data: Role[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Validasi pagination parameters
    ValidationService.validate(paginationSchema, { page, limit });

    return this.executeWithErrorHandling(
      'get paginated roles',
      async () => {
        const offset = (page - 1) * limit;
        const allData = await this.roleRepository.findAll();
        const data = allData.slice(offset, offset + limit);
        const total = allData.length;

        return {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        };
      }
    );
  }

  /**
   * Search roles by name
   * @param query - Search query
   * @param page - Page number
   * @param limit - Items per page
   * @returns Search results
   */
  async search(query: string, page: number = 1, limit: number = 10): Promise<{
    data: Role[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Validasi search parameters
    ValidationService.validate(searchWithPaginationSchema, { query, page, limit });

    return this.executeWithErrorHandling(
      'search roles',
      async () => {
        const offset = (page - 1) * limit;
        const allRoles = await this.roleRepository.findAll();
        const filteredRoles = allRoles.filter(role => 
          role.name.toLowerCase().includes(query.toLowerCase())
        );
        const total = filteredRoles.length;
        const data = filteredRoles.slice(offset, offset + limit);

        return {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        };
      }
    );
  }

  /**
   * Check apakah role name sudah digunakan
   * @param name - Role name
   * @param excludeId - ID role yang dikecualikan (untuk update)
   * @returns true jika name sudah digunakan
   */
  async isNameTaken(name: string, excludeId?: number): Promise<boolean> {
    const existingRole = await this.getByName(name);
    return existingRole !== null && existingRole.id !== excludeId;
  }

  /**
   * Get roles yang aktif
   * @returns Array of active roles
   */
  async getActiveRoles(): Promise<Role[]> {
    return this.executeWithErrorHandling(
      'get active roles',
      async () => {
        const allRoles = await this.roleRepository.findAll();
        // Assuming active roles are those that exist (no soft delete)
        return allRoles;
      }
    );
  }

  /**
   * Bulk create roles
   * @param rolesData - Array of role data
   * @returns Array of created roles
   */
  async bulkCreate(rolesData: unknown[]): Promise<Role[]> {
    // Validasi semua input
    const validatedRoles = rolesData.map(data => ValidationService.validate(roleCreateSchema, data));

    // Check duplicate names dalam batch
    const names = validatedRoles.map(role => role.name);
    const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      throw errorUtils.validation(
        `Duplicate role names in batch: ${duplicateNames.join(', ')}`
      );
    }

    // Check existing roles
    const existingRoles = await Promise.all(
      names.map(name => this.getByName(name))
    );
    const existingNames = existingRoles
      .filter((role: Role | null) => role !== null)
      .map((role: Role | null) => role!.name);
    
    if (existingNames.length > 0) {
      throw errorUtils.conflict(
        'Role',
        'names',
        existingNames.join(', ')
      );
    }

    return this.executeWithErrorHandling(
      'bulk create roles',
      async () => {
        const createdRoles: Role[] = [];
        for (const roleData of validatedRoles) {
          const createdRole = await this.roleRepository.create(roleData);
          createdRoles.push(createdRole);
        }
        return createdRoles;
      }
    );
  }

  /**
   * Bulk delete roles
   * @param ids - Array of role IDs
   * @returns Number of deleted roles
   */
  async bulkDelete(ids: number[]): Promise<number> {
    // Validasi IDs
    const validatedData = ValidationService.validate(multipleIdsSchema, { ids });

    // Check apakah semua roles exist
    const roles = await Promise.all(
      validatedData.ids.map(id => this.getById(id))
    );
    const notFoundIds = validatedData.ids.filter((id, index) => roles[index] === null);
    
    if (notFoundIds.length > 0) {
      throw errorUtils.notFound(
        'Roles',
        notFoundIds.join(', ')
      );
    }

    return this.executeWithErrorHandling(
      'bulk delete roles',
      async () => {
        let deletedCount = 0;
        for (const id of validatedData.ids) {
          const success = await this.roleRepository.delete(id);
          if (success) deletedCount++;
        }
        return deletedCount;
      }
    );
  }
}