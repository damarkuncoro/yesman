import { db } from "@/db";
import { accessLogs, users, type AccessLog, type NewAccessLog } from "@/db/schema";
import { eq, desc, and, gte, lte, like } from "drizzle-orm";
import { BaseRepository, CrudRepository, CountableRepository } from "../base/baseRepository";

/**
 * Repository untuk mengelola operasi CRUD pada tabel access_logs
 * Menyediakan metode untuk tracking semua request user dengan hasil allow/deny
 */
export class AccessLogRepository extends BaseRepository implements CrudRepository<AccessLog, NewAccessLog>, CountableRepository {

  /**
   * Mengambil semua access logs dari database
   * @returns Promise<AccessLog[]> - Array semua access logs
   */
  async findAll(): Promise<AccessLog[]> {
    return this.executeWithErrorHandling('fetch all access logs', async () => {
      return await db!.select().from(accessLogs).orderBy(desc(accessLogs.createdAt));
    });
  }

  /**
   * Mengambil semua access logs dengan data user
   * @returns Promise<(AccessLog & { user: User | null })[]> - Array access logs dengan data user
   */
  async findAllWithUsers(): Promise<(AccessLog & { user: any | null })[]> {
    return this.executeWithErrorHandling('fetch all access logs with users', async () => {
      const result = await db!.select({
        id: accessLogs.id,
        userId: accessLogs.userId,
        roleId: accessLogs.roleId,
        featureId: accessLogs.featureId,
        path: accessLogs.path,
        method: accessLogs.method,
        decision: accessLogs.decision,
        reason: accessLogs.reason,
        createdAt: accessLogs.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          department: users.department,
          region: users.region,
          level: users.level
        }
      })
      .from(accessLogs)
      .leftJoin(users, eq(accessLogs.userId, users.id))
      .orderBy(desc(accessLogs.createdAt));
      
      return result.map(row => ({
         ...row,
         user: row.user?.id ? row.user : null
       }));
    });
  }

  /**
   * Mencari access log berdasarkan ID
   * @param id - ID access log yang dicari
   * @returns Promise<AccessLog | undefined> - Access log jika ditemukan, undefined jika tidak
   */
  async findById(id: number): Promise<AccessLog | undefined> {
    return this.executeWithErrorHandling('find access log by ID', async () => {
      const result = await db!.select().from(accessLogs).where(eq(accessLogs.id, id)).limit(1);
      return this.getFirstResult(result);
    });
  }

  /**
   * Membuat access log baru
   * @param accessLogData - Data access log baru
   * @returns Promise<AccessLog> - Access log yang baru dibuat
   */
  async create(accessLogData: NewAccessLog): Promise<AccessLog> {
    return this.executeWithErrorHandling('create access log', async () => {
      const result = await db!.insert(accessLogs).values(accessLogData).returning();
      const newAccessLog = this.getFirstResult(result);
      if (!newAccessLog) {
        throw new Error('Failed to create access log - no data returned');
      }
      return newAccessLog;
    });
  }

  /**
   * Mengupdate data access log
   * @param id - ID access log yang akan diupdate
   * @param accessLogData - Data access log yang akan diupdate
   * @returns Promise<AccessLog | undefined> - Access log yang sudah diupdate atau undefined jika tidak ditemukan
   */
  async update(id: number, accessLogData: Partial<Omit<AccessLog, 'id' | 'createdAt'>>): Promise<AccessLog | undefined> {
    return this.executeWithErrorHandling('update access log', async () => {
      const result = await db!.update(accessLogs)
        .set(accessLogData)
        .where(eq(accessLogs.id, id))
        .returning();
      return this.getFirstResult(result);
    });
  }

  /**
   * Menghapus access log berdasarkan ID
   * @param id - ID access log yang akan dihapus
   * @returns Promise<boolean> - true jika berhasil dihapus, false jika tidak ditemukan
   */
  async delete(id: number): Promise<boolean> {
    return this.executeWithErrorHandling('delete access log', async () => {
      const result = await db!.delete(accessLogs).where(eq(accessLogs.id, id));
      return this.isOperationSuccessful(result.rowCount || 0);
    });
  }

  /**
   * Menghitung total access logs
   * @returns Promise<number> - Jumlah total access logs
   */
  async count(): Promise<number> {
    return this.executeWithErrorHandling('count access logs', async () => {
      const result = await db!.select().from(accessLogs);
      return result.length;
    });
  }

  /**
   * Mencari access logs berdasarkan user ID
   */
  async findByUserId(userId: number): Promise<AccessLog[]> {
    return this.executeWithErrorHandling('find access logs by user ID', async () => {
      return await db!.select().from(accessLogs)
        .where(eq(accessLogs.userId, userId))
        .orderBy(desc(accessLogs.createdAt));
    });
  }

  /**
   * Mencari access logs berdasarkan role ID
   */
  async findByRoleId(roleId: number): Promise<AccessLog[]> {
    return this.executeWithErrorHandling('find access logs by role ID', async () => {
      return await db!.select().from(accessLogs)
        .where(eq(accessLogs.roleId, roleId))
        .orderBy(desc(accessLogs.createdAt));
    });
  }

  /**
   * Mencari access logs berdasarkan feature ID
   */
  async findByFeatureId(featureId: number): Promise<AccessLog[]> {
    return this.executeWithErrorHandling('find access logs by feature ID', async () => {
      return await db!.select().from(accessLogs)
        .where(eq(accessLogs.featureId, featureId))
        .orderBy(desc(accessLogs.createdAt));
    });
  }

  /**
   * Mencari access logs berdasarkan decision (allow/deny)
   */
  async findByDecision(decision: 'allow' | 'deny'): Promise<AccessLog[]> {
    return this.executeWithErrorHandling('find access logs by decision', async () => {
      return await db!.select().from(accessLogs)
        .where(eq(accessLogs.decision, decision))
        .orderBy(desc(accessLogs.createdAt));
    });
  }

  /**
   * Mencari access logs dalam rentang tanggal tertentu
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<AccessLog[]> {
    return this.executeWithErrorHandling('find access logs by date range', async () => {
      return await db!.select().from(accessLogs)
        .where(
          and(
            gte(accessLogs.createdAt, startDate),
            lte(accessLogs.createdAt, endDate)
          )
        )
        .orderBy(desc(accessLogs.createdAt));
    });
  }

  /**
   * Mencari access logs berdasarkan path dengan pattern matching
   */
  async findByPath(pathPattern: string): Promise<AccessLog[]> {
    return this.executeWithErrorHandling('find access logs by path', async () => {
      return await db!.select().from(accessLogs)
        .where(like(accessLogs.path, `%${pathPattern}%`))
        .orderBy(desc(accessLogs.createdAt));
    });
  }

  /**
   * Mencari access logs dengan filter kombinasi
   */
  async findWithFilters(filters: {
    userId?: number;
    roleId?: number;
    featureId?: number;
    decision?: 'allow' | 'deny';
    pathPattern?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AccessLog[]> {
    const conditions: any[] = [];

    return this.executeWithErrorHandling('find access logs with filters', async () => {
      if (filters.userId) {
        conditions.push(eq(accessLogs.userId, filters.userId));
      }
      if (filters.roleId) {
        conditions.push(eq(accessLogs.roleId, filters.roleId));
      }
      if (filters.featureId) {
        conditions.push(eq(accessLogs.featureId, filters.featureId));
      }
      if (filters.decision) {
        conditions.push(eq(accessLogs.decision, filters.decision));
      }
      if (filters.pathPattern) {
        conditions.push(like(accessLogs.path, `%${filters.pathPattern}%`));
      }
      if (filters.startDate && filters.endDate) {
        conditions.push(
          and(
            gte(accessLogs.createdAt, filters.startDate),
            lte(accessLogs.createdAt, filters.endDate)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      return await db!.select().from(accessLogs)
        .where(whereClause)
        .orderBy(desc(accessLogs.createdAt));
    });
  }

  /**
   * Mendapatkan statistik access logs
   */
  async getStats(): Promise<{
    total: number;
    allowed: number;
    denied: number;
    uniqueUsers: number;
    uniquePaths: number;
  }> {
    return this.executeWithErrorHandling('get access logs stats', async () => {
      const [totalResult, allowedResult, deniedResult] = await Promise.all([
        this.count(),
        db!.select().from(accessLogs).where(eq(accessLogs.decision, 'allow')),
        db!.select().from(accessLogs).where(eq(accessLogs.decision, 'deny'))
      ]);

      const allLogs = await this.findAll();
      const uniqueUsers = new Set(allLogs.map(log => log.userId).filter(Boolean)).size;
      const uniquePaths = new Set(allLogs.map(log => log.path)).size;

      return {
        total: totalResult,
        allowed: allowedResult.length,
        denied: deniedResult.length,
        uniqueUsers,
        uniquePaths
      };
    });
  }

  /**
   * Mencari access logs terbaru dengan limit
   */
  async findRecent(limit: number = 50): Promise<AccessLog[]> {
    return this.executeWithErrorHandling('find recent access logs', async () => {
      return await db!.select().from(accessLogs)
        .orderBy(desc(accessLogs.createdAt))
        .limit(limit);
    });
  }
}

export const accessLogRepository = new AccessLogRepository();