import { eq, desc, and, gte, lte, count } from "drizzle-orm";
import { db } from "@/db";
import { policyViolations, type PolicyViolation, type NewPolicyViolation } from "@/db/schema";
import { BaseRepository, CrudRepository, CountableRepository } from "../base/baseRepository";

/**
 * Repository untuk operasi CRUD policy violations
 * Mengikuti prinsip Single Responsibility - hanya menangani akses data policy violations
 * Mengextend BaseRepository untuk menghilangkan duplikasi kode
 */
export class PolicyViolationRepository extends BaseRepository implements CrudRepository<PolicyViolation, NewPolicyViolation>, CountableRepository {
  /**
   * Mengambil semua policy violations dari database
   * @returns Promise<PolicyViolation[]> - Array semua policy violations
   */
  async findAll(): Promise<PolicyViolation[]> {
    return this.executeWithErrorHandling('fetch all policy violations', async () => {
      return await db!.select().from(policyViolations).orderBy(desc(policyViolations.createdAt));
    });
  }

  /**
   * Mencari policy violation berdasarkan ID
   * @param id - ID policy violation yang dicari
   * @returns Promise<PolicyViolation | undefined> - Policy violation jika ditemukan, undefined jika tidak
   */
  async findById(id: number): Promise<PolicyViolation | undefined> {
    return this.executeWithErrorHandling('find policy violation by ID', async () => {
      const result = await db!.select().from(policyViolations).where(eq(policyViolations.id, id)).limit(1);
      return this.getFirstResult(result);
    });
  }

  /**
   * Mencari policy violations berdasarkan user ID
   * @param userId - ID user yang dicari
   * @returns Promise<PolicyViolation[]> - Array policy violations untuk user tersebut
   */
  async findByUserId(userId: number): Promise<PolicyViolation[]> {
    return this.executeWithErrorHandling('find policy violations by user ID', async () => {
      return await db!.select().from(policyViolations)
        .where(eq(policyViolations.userId, userId))
        .orderBy(desc(policyViolations.createdAt));
    });
  }

  /**
   * Mencari policy violations berdasarkan feature ID
   * @param featureId - ID feature yang dicari
   * @returns Promise<PolicyViolation[]> - Array policy violations untuk feature tersebut
   */
  async findByFeatureId(featureId: number): Promise<PolicyViolation[]> {
    return this.executeWithErrorHandling('find policy violations by feature ID', async () => {
      return await db!.select().from(policyViolations)
        .where(eq(policyViolations.featureId, featureId))
        .orderBy(desc(policyViolations.createdAt));
    });
  }

  /**
   * Mencari policy violations berdasarkan policy ID
   * @param policyId - ID policy yang dicari
   * @returns Promise<PolicyViolation[]> - Array policy violations untuk policy tersebut
   */
  async findByPolicyId(policyId: number): Promise<PolicyViolation[]> {
    return this.executeWithErrorHandling('find policy violations by policy ID', async () => {
      return await db!.select().from(policyViolations)
        .where(eq(policyViolations.policyId, policyId))
        .orderBy(desc(policyViolations.createdAt));
    });
  }

  /**
   * Mencari policy violations berdasarkan attribute
   * @param attribute - Attribute yang dicari (department, region, level)
   * @returns Promise<PolicyViolation[]> - Array policy violations untuk attribute tersebut
   */
  async findByAttribute(attribute: string): Promise<PolicyViolation[]> {
    return this.executeWithErrorHandling('find policy violations by attribute', async () => {
      return await db!.select().from(policyViolations)
        .where(eq(policyViolations.attribute, attribute))
        .orderBy(desc(policyViolations.createdAt));
    });
  }

  /**
   * Mencari policy violations dalam rentang waktu tertentu
   * @param startDate - Tanggal mulai
   * @param endDate - Tanggal akhir
   * @returns Promise<PolicyViolation[]> - Array policy violations dalam rentang waktu
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<PolicyViolation[]> {
    return this.executeWithErrorHandling('find policy violations by date range', async () => {
      return await db!.select().from(policyViolations)
        .where(and(
          gte(policyViolations.createdAt, startDate),
          lte(policyViolations.createdAt, endDate)
        ))
        .orderBy(desc(policyViolations.createdAt));
    });
  }

  /**
   * Membuat policy violation baru
   * @param policyViolationData - Data policy violation baru
   * @returns Promise<PolicyViolation> - Policy violation yang baru dibuat
   */
  async create(policyViolationData: NewPolicyViolation): Promise<PolicyViolation> {
    return this.executeWithErrorHandling('create policy violation', async () => {
      const result = await db!.insert(policyViolations).values(policyViolationData).returning();
      return this.getFirstResult(result)!;
    });
  }

  /**
   * Mengupdate policy violation berdasarkan ID
   * @param id - ID policy violation yang akan diupdate
   * @param updateData - Data yang akan diupdate
   * @returns Promise<PolicyViolation | undefined> - Policy violation yang telah diupdate atau undefined
   */
  async update(id: number, updateData: Partial<Omit<PolicyViolation, 'id' | 'createdAt'>>): Promise<PolicyViolation | undefined> {
    return this.executeWithErrorHandling('update policy violation', async () => {
      const result = await db!.update(policyViolations)
        .set(updateData)
        .where(eq(policyViolations.id, id))
        .returning();
      return this.getFirstResult(result);
    });
  }

  /**
   * Menghapus policy violation berdasarkan ID
   * @param id - ID policy violation yang akan dihapus
   * @returns Promise<boolean> - true jika berhasil dihapus, false jika tidak
   */
  async delete(id: number): Promise<boolean> {
    return this.executeWithErrorHandling('delete policy violation', async () => {
      const result = await db!.delete(policyViolations).where(eq(policyViolations.id, id));
      return this.isOperationSuccessful(result.rowCount || 0);
    });
  }

  /**
   * Menghitung total jumlah policy violations
   * @returns Promise<number> - Jumlah total policy violations
   */
  async count(): Promise<number> {
    return this.executeWithErrorHandling('count policy violations', async () => {
      const result = await db!.select({ count: count() }).from(policyViolations);
      return result[0]?.count || 0;
    });
  }

  /**
   * Menghapus policy violations lama berdasarkan tanggal
   * @param beforeDate - Tanggal batas, policy violations sebelum tanggal ini akan dihapus
   * @returns Promise<number> - Jumlah policy violations yang dihapus
   */
  async deleteOldViolations(beforeDate: Date): Promise<number> {
    return this.executeWithErrorHandling('delete old policy violations', async () => {
      const result = await db!.delete(policyViolations)
        .where(lte(policyViolations.createdAt, beforeDate));
      return result.rowCount || 0;
    });
  }

  /**
   * Mencari policy violations berdasarkan kombinasi user dan feature
   * @param userId - ID user
   * @param featureId - ID feature
   * @returns Promise<PolicyViolation[]> - Array policy violations untuk kombinasi user dan feature
   */
  async findByUserAndFeature(userId: number, featureId: number): Promise<PolicyViolation[]> {
    return this.executeWithErrorHandling('find policy violations by user and feature', async () => {
      return await db!.select().from(policyViolations)
        .where(and(
          eq(policyViolations.userId, userId),
          eq(policyViolations.featureId, featureId)
        ))
        .orderBy(desc(policyViolations.createdAt));
    });
  }
}