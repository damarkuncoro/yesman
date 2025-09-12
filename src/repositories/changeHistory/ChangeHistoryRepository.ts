import { eq, desc, and, gte, lte, count } from "drizzle-orm";
import { db } from "@/db";
import { changeHistory, type ChangeHistory, type NewChangeHistory } from "@/db/schema";
import { BaseRepository, CrudRepository, CountableRepository } from "../base/baseRepository";

/**
 * Repository untuk operasi CRUD change history
 * Mengikuti prinsip Single Responsibility - hanya menangani akses data change history
 * Mengextend BaseRepository untuk menghilangkan duplikasi kode
 */
export class ChangeHistoryRepository extends BaseRepository implements CrudRepository<ChangeHistory, NewChangeHistory>, CountableRepository {
  /**
   * Mengambil semua change history dari database
   * @returns Promise<ChangeHistory[]> - Array semua change history
   */
  async findAll(): Promise<ChangeHistory[]> {
    return this.executeWithErrorHandling('fetch all change history', async () => {
      return await db!.select().from(changeHistory).orderBy(desc(changeHistory.createdAt));
    });
  }

  /**
   * Mencari change history berdasarkan ID
   * @param id - ID change history yang dicari
   * @returns Promise<ChangeHistory | undefined> - Change history jika ditemukan, undefined jika tidak
   */
  async findById(id: number): Promise<ChangeHistory | undefined> {
    return this.executeWithErrorHandling('find change history by ID', async () => {
      const result = await db!.select().from(changeHistory).where(eq(changeHistory.id, id)).limit(1);
      return this.getFirstResult(result);
    });
  }

  /**
   * Mencari change history berdasarkan admin user ID
   * @param adminUserId - ID admin user yang dicari
   * @returns Promise<ChangeHistory[]> - Array change history untuk admin user tersebut
   */
  async findByAdminUserId(adminUserId: number): Promise<ChangeHistory[]> {
    return this.executeWithErrorHandling('find change history by admin user ID', async () => {
      return await db!.select().from(changeHistory)
        .where(eq(changeHistory.adminUserId, adminUserId))
        .orderBy(desc(changeHistory.createdAt));
    });
  }

  /**
   * Mencari change history berdasarkan target user ID
   * @param targetUserId - ID target user yang dicari
   * @returns Promise<ChangeHistory[]> - Array change history untuk target user tersebut
   */
  async findByTargetUserId(targetUserId: number): Promise<ChangeHistory[]> {
    return this.executeWithErrorHandling('find change history by target user ID', async () => {
      return await db!.select().from(changeHistory)
        .where(eq(changeHistory.targetUserId, targetUserId))
        .orderBy(desc(changeHistory.createdAt));
    });
  }

  /**
   * Mencari change history berdasarkan action
   * @param action - Action yang dicari (assignRole, revokeRole, updatePolicy, etc)
   * @returns Promise<ChangeHistory[]> - Array change history untuk action tersebut
   */
  async findByAction(action: string): Promise<ChangeHistory[]> {
    return this.executeWithErrorHandling('find change history by action', async () => {
      return await db!.select().from(changeHistory)
        .where(eq(changeHistory.action, action))
        .orderBy(desc(changeHistory.createdAt));
    });
  }

  /**
   * Mencari change history dalam rentang waktu tertentu
   * @param startDate - Tanggal mulai
   * @param endDate - Tanggal akhir
   * @returns Promise<ChangeHistory[]> - Array change history dalam rentang waktu
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<ChangeHistory[]> {
    return this.executeWithErrorHandling('find change history by date range', async () => {
      return await db!.select().from(changeHistory)
        .where(and(
          gte(changeHistory.createdAt, startDate),
          lte(changeHistory.createdAt, endDate)
        ))
        .orderBy(desc(changeHistory.createdAt));
    });
  }

  /**
   * Mencari change history berdasarkan kombinasi admin dan target user
   * @param adminUserId - ID admin user
   * @param targetUserId - ID target user
   * @returns Promise<ChangeHistory[]> - Array change history untuk kombinasi admin dan target user
   */
  async findByAdminAndTargetUser(adminUserId: number, targetUserId: number): Promise<ChangeHistory[]> {
    return this.executeWithErrorHandling('find change history by admin and target user', async () => {
      return await db!.select().from(changeHistory)
        .where(and(
          eq(changeHistory.adminUserId, adminUserId),
          eq(changeHistory.targetUserId, targetUserId)
        ))
        .orderBy(desc(changeHistory.createdAt));
    });
  }

  /**
   * Mencari change history berdasarkan action dan target user
   * @param action - Action yang dicari
   * @param targetUserId - ID target user
   * @returns Promise<ChangeHistory[]> - Array change history untuk kombinasi action dan target user
   */
  async findByActionAndTargetUser(action: string, targetUserId: number): Promise<ChangeHistory[]> {
    return this.executeWithErrorHandling('find change history by action and target user', async () => {
      return await db!.select().from(changeHistory)
        .where(and(
          eq(changeHistory.action, action),
          eq(changeHistory.targetUserId, targetUserId)
        ))
        .orderBy(desc(changeHistory.createdAt));
    });
  }

  /**
   * Membuat change history baru
   * @param changeHistoryData - Data change history baru
   * @returns Promise<ChangeHistory> - Change history yang baru dibuat
   */
  async create(changeHistoryData: NewChangeHistory): Promise<ChangeHistory> {
    return this.executeWithErrorHandling('create change history', async () => {
      const result = await db!.insert(changeHistory).values(changeHistoryData).returning();
      return this.getFirstResult(result)!;
    });
  }

  /**
   * Mengupdate change history berdasarkan ID
   * @param id - ID change history yang akan diupdate
   * @param updateData - Data yang akan diupdate
   * @returns Promise<ChangeHistory | undefined> - Change history yang telah diupdate atau undefined
   */
  async update(id: number, updateData: Partial<Omit<ChangeHistory, 'id' | 'createdAt'>>): Promise<ChangeHistory | undefined> {
    return this.executeWithErrorHandling('update change history', async () => {
      const result = await db!.update(changeHistory)
        .set(updateData)
        .where(eq(changeHistory.id, id))
        .returning();
      return this.getFirstResult(result);
    });
  }

  /**
   * Menghapus change history berdasarkan ID
   * @param id - ID change history yang akan dihapus
   * @returns Promise<boolean> - true jika berhasil dihapus, false jika tidak
   */
  async delete(id: number): Promise<boolean> {
    return this.executeWithErrorHandling('delete change history', async () => {
      const result = await db!.delete(changeHistory).where(eq(changeHistory.id, id));
      return this.isOperationSuccessful(result.rowCount || 0);
    });
  }

  /**
   * Menghitung total jumlah change history
   * @returns Promise<number> - Jumlah total change history
   */
  async count(): Promise<number> {
    return this.executeWithErrorHandling('count change history', async () => {
      const result = await db!.select({ count: count() }).from(changeHistory);
      return result[0]?.count || 0;
    });
  }

  /**
   * Menghapus change history lama berdasarkan tanggal
   * @param beforeDate - Tanggal batas, change history sebelum tanggal ini akan dihapus
   * @returns Promise<number> - Jumlah change history yang dihapus
   */
  async deleteOldHistory(beforeDate: Date): Promise<number> {
    return this.executeWithErrorHandling('delete old change history', async () => {
      const result = await db!.delete(changeHistory)
        .where(lte(changeHistory.createdAt, beforeDate));
      return result.rowCount || 0;
    });
  }

  /**
   * Mencari change history terbaru untuk target user tertentu
   * @param targetUserId - ID target user
   * @param limit - Jumlah maksimal record yang dikembalikan (default: 10)
   * @returns Promise<ChangeHistory[]> - Array change history terbaru
   */
  async findRecentByTargetUser(targetUserId: number, limit: number = 10): Promise<ChangeHistory[]> {
    return this.executeWithErrorHandling('find recent change history by target user', async () => {
      return await db!.select().from(changeHistory)
        .where(eq(changeHistory.targetUserId, targetUserId))
        .orderBy(desc(changeHistory.createdAt))
        .limit(limit);
    });
  }

  /**
   * Mencari change history berdasarkan action dengan pagination
   * @param action - Action yang dicari
   * @param offset - Offset untuk pagination
   * @param limit - Limit untuk pagination
   * @returns Promise<ChangeHistory[]> - Array change history dengan pagination
   */
  async findByActionWithPagination(action: string, offset: number = 0, limit: number = 50): Promise<ChangeHistory[]> {
    return this.executeWithErrorHandling('find change history by action with pagination', async () => {
      return await db!.select().from(changeHistory)
        .where(eq(changeHistory.action, action))
        .orderBy(desc(changeHistory.createdAt))
        .offset(offset)
        .limit(limit);
    });
  }
}