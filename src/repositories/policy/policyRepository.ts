import { eq, count } from "drizzle-orm";
import { db } from "@/db";
import { policies, type Policy, type NewPolicy } from "@/db/schema";
import { BaseRepository, CrudRepository, CountableRepository } from "../base/baseRepository";

/**
 * Repository untuk operasi CRUD policy
 * Mengikuti prinsip Single Responsibility - hanya menangani akses data policy
 * Mengextend BaseRepository untuk menghilangkan duplikasi kode
 */
export class PolicyRepository extends BaseRepository implements CrudRepository<Policy, NewPolicy>, CountableRepository {
  /**
   * Mengambil semua policy dari database
   * @returns Promise<Policy[]> - Array semua policy
   */
  async findAll(): Promise<Policy[]> {
    return this.executeWithErrorHandling('fetch all policies', async () => {
      return await db!.select().from(policies);
    });
  }

  /**
   * Mengambil policy berdasarkan ID
   * @param id - ID policy yang dicari
   * @returns Promise<Policy | undefined> - Policy jika ditemukan, undefined jika tidak
   */
  async findById(id: number): Promise<Policy | undefined> {
    return this.executeWithErrorHandling('fetch policy by id', async () => {
      const result = await db!.select().from(policies).where(eq(policies.id, id));
      return result[0];
    });
  }

  /**
   * Mengambil policies berdasarkan feature ID
   * @param featureId - ID feature yang dicari
   * @returns Promise<Policy[]> - Array policy untuk feature tersebut
   */
  async findByFeatureId(featureId: number): Promise<Policy[]> {
    return this.executeWithErrorHandling('fetch policies by feature id', async () => {
      return await db!.select().from(policies).where(eq(policies.featureId, featureId));
    });
  }

  /**
   * Mengambil policies berdasarkan attribute
   * @param attribute - Attribute yang dicari (department, region, level)
   * @returns Promise<Policy[]> - Array policy untuk attribute tersebut
   */
  async findByAttribute(attribute: string): Promise<Policy[]> {
    return this.executeWithErrorHandling('fetch policies by attribute', async () => {
      return await db!.select().from(policies).where(eq(policies.attribute, attribute));
    });
  }

  /**
   * Membuat policy baru
   * @param policyData - Data policy yang akan dibuat
   * @returns Promise<Policy> - Policy yang berhasil dibuat
   */
  async create(policyData: NewPolicy): Promise<Policy> {
    return this.executeWithErrorHandling('create policy', async () => {
      const result = await db!.insert(policies).values(policyData).returning();
      return result[0];
    });
  }

  /**
   * Mengupdate policy berdasarkan ID
   * @param id - ID policy yang akan diupdate
   * @param updateData - Data yang akan diupdate
   * @returns Promise<Policy | undefined> - Policy yang berhasil diupdate atau undefined jika tidak ditemukan
   */
  async update(id: number, updateData: Partial<NewPolicy>): Promise<Policy | undefined> {
    return this.executeWithErrorHandling('update policy', async () => {
      const result = await db!.update(policies)
        .set(updateData)
        .where(eq(policies.id, id))
        .returning();
      return result[0];
    });
  }

  /**
   * Menghapus policy secara permanen (hard delete)
   * @param id - ID policy yang akan dihapus
   * @returns Promise<boolean> - true jika berhasil, false jika tidak
   */
  async delete(id: number): Promise<boolean> {
    return this.executeWithErrorHandling('delete policy', async () => {
      const result = await db!.delete(policies).where(eq(policies.id, id));
      return this.isOperationSuccessful(result.rowCount || 0);
    });
  }

  /**
   * Menghitung total jumlah policy
   * @returns Promise<number> - Jumlah total policy
   */
  async count(): Promise<number> {
    return this.executeWithErrorHandling('count policies', async () => {
      const result = await db!.select({ count: count() }).from(policies);
      return result[0]?.count || 0;
    });
  }

  /**
   * Menghitung jumlah policy berdasarkan feature ID
   * @param featureId - ID feature yang dicari
   * @returns Promise<number> - Jumlah policy untuk feature tersebut
   */
  async countByFeatureId(featureId: number): Promise<number> {
    return this.executeWithErrorHandling('count policies by feature id', async () => {
      const result = await db!.select({ count: count() })
        .from(policies)
        .where(eq(policies.featureId, featureId));
      return result[0]?.count || 0;
    });
  }

  /**
   * Menghapus semua policy untuk feature tertentu
   * @param featureId - ID feature yang policy-nya akan dihapus
   * @returns Promise<boolean> - true jika berhasil
   */
  async deleteByFeatureId(featureId: number): Promise<boolean> {
    return this.executeWithErrorHandling('delete policies by feature id', async () => {
      const result = await db!.delete(policies).where(eq(policies.featureId, featureId));
      return this.isOperationSuccessful(result.rowCount || 0);
    });
  }
}

// Export instance untuk backward compatibility
export const policyRepository = new PolicyRepository('PolicyRepository');