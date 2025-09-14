import { eq, and, count } from "drizzle-orm";
import { db } from "@/db";
import { userRoles, type UserRole, type NewUserRole } from "@/db/schema";
import { BaseRepository, CrudRepository, CountableRepository } from "../base/baseRepository";

/**
 * Repository untuk operasi CRUD user role (junction table)
 * Mengikuti prinsip Single Responsibility - hanya menangani akses data user role
 * Mengextend BaseRepository untuk menghilangkan duplikasi kode
 */
export class UserRoleRepository extends BaseRepository implements CrudRepository<UserRole, NewUserRole>, CountableRepository {
  /**
   * Mengambil semua user role dari database
   * @returns Promise<UserRole[]> - Array semua user role
   */
  async findAll(): Promise<UserRole[]> {
    return this.executeWithErrorHandling('fetch all user roles', async () => {
      return await db!.select().from(userRoles);
    });
  }

  /**
   * Mencari user role berdasarkan ID
   * @param id - ID user role yang dicari
   * @returns Promise<UserRole | undefined> - UserRole jika ditemukan, undefined jika tidak
   */
  async findById(id: number): Promise<UserRole | undefined> {
    return this.executeWithErrorHandling('find user role by ID', async () => {
      const result = await db!.select().from(userRoles).where(eq(userRoles.id, id)).limit(1);
      return this.getFirstResult(result);
    });
  }

  /**
   * Mencari user role berdasarkan user ID
   * @param userId - ID user yang dicari
   * @returns Promise<UserRole[]> - Array user role milik user
   */
  async findByUserId(userId: number): Promise<UserRole[]> {
    return this.executeWithErrorHandling('find user roles by user ID', async () => {
      return await db!.select().from(userRoles).where(eq(userRoles.userId, userId));
    });
  }

  /**
   * Mencari user role berdasarkan role ID
   * @param roleId - ID role yang dicari
   * @returns Promise<UserRole[]> - Array user role dengan role tertentu
   */
  async findByRoleId(roleId: number): Promise<UserRole[]> {
    return this.executeWithErrorHandling('find user roles by role ID', async () => {
      return await db!.select().from(userRoles).where(eq(userRoles.roleId, roleId));
    });
  }

  /**
   * Mencari user role berdasarkan user ID dan role ID
   * @param userId - ID user
   * @param roleId - ID role
   * @returns Promise<UserRole | undefined> - UserRole jika ditemukan, undefined jika tidak
   */
  async findByUserAndRole(userId: number, roleId: number): Promise<UserRole | undefined> {
    return this.executeWithErrorHandling('find user role by user and role', async () => {
      const result = await db!.select().from(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
        .limit(1);
      return this.getFirstResult(result);
    });
  }

  /**
   * Membuat user role baru (assign role ke user)
   * @param userRoleData - Data user role baru
   * @returns Promise<UserRole> - UserRole yang baru dibuat
   */
  async create(userRoleData: NewUserRole): Promise<UserRole> {
    return this.executeWithErrorHandling('create user role', async () => {
      const result = await db!.insert(userRoles).values(userRoleData).returning();
      const newUserRole = this.getFirstResult(result);
      if (!newUserRole) {
        throw new Error('Failed to create user role - no data returned');
      }
      return newUserRole;
    });
  }

  /**
   * Mengupdate data user role (tidak umum digunakan untuk junction table)
   * @param id - ID user role yang akan diupdate
   * @param userRoleData - Data user role yang akan diupdate
   * @returns Promise<UserRole | undefined> - UserRole yang sudah diupdate atau undefined jika tidak ditemukan
   */
  async update(id: number, userRoleData: Partial<Omit<UserRole, 'id'>>): Promise<UserRole | undefined> {
    return this.executeWithErrorHandling('update user role', async () => {
      const result = await db!.update(userRoles)
        .set(userRoleData)
        .where(eq(userRoles.id, id))
        .returning();
      return this.getFirstResult(result);
    });
  }

  /**
   * Menghitung total jumlah user role di database
   * @returns Promise<number> - Jumlah total user role
   */
  async count(): Promise<number> {
    return this.executeWithErrorHandling('count user roles', async () => {
      const result = await db!.select({ count: count() }).from(userRoles);
      return Number(result[0]?.count || 0);
    });
  }

  /**
   * Menghapus user role berdasarkan ID
   * @param id - ID user role yang akan dihapus
   * @returns Promise<boolean> - true jika berhasil, false jika tidak
   */
  async delete(id: number): Promise<boolean> {
    return this.executeWithErrorHandling('delete user role', async () => {
      const result = await db!.delete(userRoles).where(eq(userRoles.id, id));
      return this.isOperationSuccessful(result.rowCount || 0);
    });
  }

  /**
   * Menghapus user role berdasarkan user ID dan role ID
   * @param userId - ID user
   * @param roleId - ID role
   * @returns Promise<boolean> - true jika berhasil, false jika tidak
   */
  async deleteByUserAndRole(userId: number, roleId: number): Promise<boolean> {
    return this.executeWithErrorHandling('delete user role by user and role', async () => {
      const result = await db!.delete(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
      return this.isOperationSuccessful(result.rowCount || 0);
    });
  }

  /**
   * Menghapus semua role dari user
   * @param userId - ID user yang role-nya akan dihapus
   * @returns Promise<number> - Jumlah role yang dihapus
   */
  async deleteAllUserRoles(userId: number): Promise<number> {
    return this.executeWithErrorHandling('delete all user roles', async () => {
      const result = await db!.delete(userRoles).where(eq(userRoles.userId, userId));
      return result.rowCount || 0;
    });
  }

  /**
   * Menghapus semua user dari role
   * @param roleId - ID role yang user-nya akan dihapus
   * @returns Promise<number> - Jumlah user yang dihapus dari role
   */
  async deleteAllRoleUsers(roleId: number): Promise<number> {
    return this.executeWithErrorHandling('delete all role users', async () => {
      const result = await db!.delete(userRoles).where(eq(userRoles.roleId, roleId));
      return result.rowCount || 0;
    });
  }

  /**
   * Mengecek apakah user memiliki role tertentu
   * @param userId - ID user
   * @param roleId - ID role
   * @returns Promise<boolean> - true jika user memiliki role, false jika tidak
   */
  async userHasRole(userId: number, roleId: number): Promise<boolean> {
    return this.executeWithErrorHandling('check user has role', async () => {
      const userRole = await this.findByUserAndRole(userId, roleId);
      return userRole !== undefined;
    });
  }

  /**
   * Menghitung jumlah user yang memiliki role tertentu
   * @param roleId - ID role
   * @returns Promise<number> - Jumlah user dengan role tersebut
   */
  async countUsersByRole(roleId: number): Promise<number> {
    return this.executeWithErrorHandling('count users by role', async () => {
      const result = await db!.select({ count: count() }).from(userRoles)
        .where(eq(userRoles.roleId, roleId));
      return Number(result[0]?.count || 0);
    });
  }

  /**
   * Menghitung jumlah role yang dimiliki user
   * @param userId - ID user
   * @returns Promise<number> - Jumlah role yang dimiliki user
   */
  async countRolesByUser(userId: number): Promise<number> {
    return this.executeWithErrorHandling('count roles by user', async () => {
      const result = await db!.select({ count: count() }).from(userRoles)
        .where(eq(userRoles.userId, userId));
      return Number(result[0]?.count || 0);
    });
  }
}

// Export instance untuk backward compatibility
export const userRoleRepository = new UserRoleRepository('UserRoleRepository');