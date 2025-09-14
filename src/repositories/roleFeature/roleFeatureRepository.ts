import { eq, and, count } from "drizzle-orm";
import { db } from "@/db";
import { roleFeatures, type RoleFeature, type NewRoleFeature } from "@/db/schema";
import { BaseRepository, CrudRepository, CountableRepository } from "../base/baseRepository";

/**
 * Repository untuk operasi CRUD role feature (junction table)
 * Mengikuti prinsip Single Responsibility - hanya menangani akses data role feature
 * Mengextend BaseRepository untuk menghilangkan duplikasi kode
 */
export class RoleFeatureRepository extends BaseRepository implements CrudRepository<RoleFeature, NewRoleFeature>, CountableRepository {
  /**
   * Mengambil semua role feature dari database
   * @returns Promise<RoleFeature[]> - Array semua role feature
   */
  async findAll(): Promise<RoleFeature[]> {
    return this.executeWithErrorHandling('fetch all role features', async () => {
      return await db!.select().from(roleFeatures);
    });
  }

  /**
   * Mencari role feature berdasarkan ID
   * @param id - ID role feature yang dicari
   * @returns Promise<RoleFeature | undefined> - RoleFeature jika ditemukan, undefined jika tidak
   */
  async findById(id: number): Promise<RoleFeature | undefined> {
    return this.executeWithErrorHandling('find role feature by ID', async () => {
      const result = await db!.select().from(roleFeatures).where(eq(roleFeatures.id, id)).limit(1);
      return this.getFirstResult(result);
    });
  }

  /**
   * Mencari role feature berdasarkan role ID
   * @param roleId - ID role yang dicari
   * @returns Promise<RoleFeature[]> - Array role feature milik role
   */
  async findByRoleId(roleId: number): Promise<RoleFeature[]> {
    return this.executeWithErrorHandling('find role features by role ID', async () => {
      return await db!.select().from(roleFeatures).where(eq(roleFeatures.roleId, roleId));
    });
  }

  /**
   * Mencari role feature berdasarkan feature ID
   * @param featureId - ID feature yang dicari
   * @returns Promise<RoleFeature[]> - Array role feature dengan feature tertentu
   */
  async findByFeatureId(featureId: number): Promise<RoleFeature[]> {
    return this.executeWithErrorHandling('find role features by feature ID', async () => {
      return await db!.select().from(roleFeatures).where(eq(roleFeatures.featureId, featureId));
    });
  }

  /**
   * Mencari role feature berdasarkan role ID dan feature ID
   * @param roleId - ID role
   * @param featureId - ID feature
   * @returns Promise<RoleFeature | undefined> - RoleFeature jika ditemukan, undefined jika tidak
   */
  async findByRoleAndFeature(roleId: number, featureId: number): Promise<RoleFeature | undefined> {
    return this.executeWithErrorHandling('find role feature by role and feature', async () => {
      const result = await db!.select().from(roleFeatures)
        .where(and(eq(roleFeatures.roleId, roleId), eq(roleFeatures.featureId, featureId)))
        .limit(1);
      return this.getFirstResult(result);
    });
  }

  /**
   * Membuat role feature baru (assign feature ke role)
   * @param roleFeatureData - Data role feature baru
   * @returns Promise<RoleFeature> - RoleFeature yang baru dibuat
   */
  async create(roleFeatureData: NewRoleFeature): Promise<RoleFeature> {
    return this.executeWithErrorHandling('create role feature', async () => {
      const result = await db!.insert(roleFeatures).values(roleFeatureData).returning();
      const newRoleFeature = this.getFirstResult(result);
      if (!newRoleFeature) {
        throw new Error('Failed to create role feature - no data returned');
      }
      return newRoleFeature;
    });
  }

  /**
   * Mengupdate data role feature (tidak umum digunakan untuk junction table)
   * @param id - ID role feature yang akan diupdate
   * @param roleFeatureData - Data role feature yang akan diupdate
   * @returns Promise<RoleFeature | undefined> - RoleFeature yang sudah diupdate atau undefined jika tidak ditemukan
   */
  async update(id: number, roleFeatureData: Partial<Omit<RoleFeature, 'id'>>): Promise<RoleFeature | undefined> {
    return this.executeWithErrorHandling('update role feature', async () => {
      const result = await db!.update(roleFeatures)
        .set(roleFeatureData)
        .where(eq(roleFeatures.id, id))
        .returning();
      return this.getFirstResult(result);
    });
  }

  /**
   * Menghitung total jumlah role feature di database
   * @returns Promise<number> - Jumlah total role feature
   */
  async count(): Promise<number> {
    return this.executeWithErrorHandling('count role features', async () => {
      const result = await db!.select({ count: count() }).from(roleFeatures);
      return Number(result[0]?.count || 0);
    });
  }

  /**
   * Menghapus role feature berdasarkan ID
   * @param id - ID role feature yang akan dihapus
   * @returns Promise<boolean> - true jika berhasil, false jika tidak
   */
  async delete(id: number): Promise<boolean> {
    return this.executeWithErrorHandling('delete role feature', async () => {
      const result = await db!.delete(roleFeatures).where(eq(roleFeatures.id, id));
      return this.isOperationSuccessful(result.rowCount || 0);
    });
  }

  /**
   * Menghapus role feature berdasarkan role ID dan feature ID
   * @param roleId - ID role
   * @param featureId - ID feature
   * @returns Promise<boolean> - true jika berhasil, false jika tidak
   */
  async deleteByRoleAndFeature(roleId: number, featureId: number): Promise<boolean> {
    return this.executeWithErrorHandling('delete role feature by role and feature', async () => {
      const result = await db!.delete(roleFeatures)
        .where(and(eq(roleFeatures.roleId, roleId), eq(roleFeatures.featureId, featureId)));
      return this.isOperationSuccessful(result.rowCount || 0);
    });
  }

  /**
   * Menghapus semua feature dari role
   * @param roleId - ID role yang feature-nya akan dihapus
   * @returns Promise<number> - Jumlah feature yang dihapus
   */
  async deleteAllRoleFeatures(roleId: number): Promise<number> {
    return this.executeWithErrorHandling('delete all role features', async () => {
      const result = await db!.delete(roleFeatures).where(eq(roleFeatures.roleId, roleId));
      return result.rowCount || 0;
    });
  }

  /**
   * Menghapus semua role dari feature
   * @param featureId - ID feature yang role-nya akan dihapus
   * @returns Promise<number> - Jumlah role yang dihapus dari feature
   */
  async deleteAllFeatureRoles(featureId: number): Promise<number> {
    return this.executeWithErrorHandling('delete all feature roles', async () => {
      const result = await db!.delete(roleFeatures).where(eq(roleFeatures.featureId, featureId));
      return result.rowCount || 0;
    });
  }

  /**
   * Mengecek apakah role memiliki feature tertentu
   * @param roleId - ID role
   * @param featureId - ID feature
   * @returns Promise<boolean> - true jika role memiliki feature, false jika tidak
   */
  async roleHasFeature(roleId: number, featureId: number): Promise<boolean> {
    return this.executeWithErrorHandling('check role has feature', async () => {
      const roleFeature = await this.findByRoleAndFeature(roleId, featureId);
      return roleFeature !== undefined;
    });
  }

  /**
   * Menghitung jumlah role yang memiliki feature tertentu
   * @param featureId - ID feature
   * @returns Promise<number> - Jumlah role dengan feature tersebut
   */
  async countRolesByFeature(featureId: number): Promise<number> {
    return this.executeWithErrorHandling('count roles by feature', async () => {
      const result = await db!.select({ count: count() }).from(roleFeatures)
        .where(eq(roleFeatures.featureId, featureId));
      return Number(result[0]?.count || 0);
    });
  }

  /**
   * Menghitung jumlah feature yang dimiliki role
   * @param roleId - ID role
   * @returns Promise<number> - Jumlah feature yang dimiliki role
   */
  async countFeaturesByRole(roleId: number): Promise<number> {
    return this.executeWithErrorHandling('count features by role', async () => {
      const result = await db!.select({ count: count() }).from(roleFeatures)
        .where(eq(roleFeatures.roleId, roleId));
      return Number(result[0]?.count || 0);
    });
  }

  /**
   * Batch assign multiple features ke role
   * @param roleId - ID role
   * @param featureIds - Array ID feature yang akan di-assign
   * @returns Promise<RoleFeature[]> - Array RoleFeature yang baru dibuat
   */
  async assignFeaturesToRole(roleId: number, featureIds: number[]): Promise<RoleFeature[]> {
    return this.executeWithErrorHandling('assign features to role', async () => {
      const roleFeatureData = featureIds.map(featureId => ({ roleId, featureId }));
      const result = await db!.insert(roleFeatures).values(roleFeatureData).returning();
      return result;
    });
  }

  /**
   * Batch assign multiple roles ke feature
   * @param featureId - ID feature
   * @param roleIds - Array ID role yang akan di-assign
   * @returns Promise<RoleFeature[]> - Array RoleFeature yang baru dibuat
   */
  async assignRolesToFeature(featureId: number, roleIds: number[]): Promise<RoleFeature[]> {
    return this.executeWithErrorHandling('assign roles to feature', async () => {
      const roleFeatureData = roleIds.map(roleId => ({ roleId, featureId }));
      const result = await db!.insert(roleFeatures).values(roleFeatureData).returning();
      return result;
    });
  }
}

// Export instance untuk backward compatibility
export const roleFeatureRepository = new RoleFeatureRepository('RoleFeatureRepository');