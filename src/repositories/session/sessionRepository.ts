import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, type Session, type NewSession } from "@/db/schema";
import { BaseRepository, CrudRepository } from "../base/baseRepository";

/**
 * Repository untuk operasi CRUD session
 * Mengikuti prinsip Single Responsibility - hanya menangani akses data session
 * Mengextend BaseRepository untuk menghilangkan duplikasi kode
 */
export class SessionRepository extends BaseRepository implements CrudRepository<Session, NewSession> {
  /**
   * Mengambil semua session dari database
   * @returns Promise<Session[]> - Array semua session
   */
  async findAll(): Promise<Session[]> {
    return this.executeWithErrorHandling('fetch all sessions', async () => {
      return await db!.select().from(sessions);
    });
  }

  /**
   * Mencari session berdasarkan ID
   * @param id - ID session yang dicari
   * @returns Promise<Session | undefined> - Session jika ditemukan, undefined jika tidak
   */
  async findById(id: number): Promise<Session | undefined> {
    return this.executeWithErrorHandling('find session by ID', async () => {
      const result = await db!.select().from(sessions).where(eq(sessions.id, id)).limit(1);
      return this.getFirstResult(result);
    });
  }

  /**
   * Mencari session berdasarkan token
   * @param token - Session token yang dicari
   * @returns Promise<Session | undefined> - Session jika ditemukan, undefined jika tidak
   */
  async findByToken(token: string): Promise<Session | undefined> {
    return this.executeWithErrorHandling('find session by token', async () => {
      const result = await db!.select().from(sessions)
        .where(eq(sessions.refreshToken, token)) // Menggunakan refreshToken karena hanya itu yang ada di schema
        .limit(1);
      return this.getFirstResult(result);
    });
  }

  /**
   * Mencari session berdasarkan refresh token
   * @param refreshToken - Refresh token yang dicari
   * @returns Promise<Session | undefined> - Session jika ditemukan, undefined jika tidak
   */
  async findByRefreshToken(refreshToken: string): Promise<Session | undefined> {
    return this.executeWithErrorHandling('find session by refresh token', async () => {
      const result = await db!.select().from(sessions)
        .where(eq(sessions.refreshToken, refreshToken))
        .limit(1);
      return this.getFirstResult(result);
    });
  }

  /**
   * Mencari session berdasarkan user ID
   * @param userId - ID user yang dicari
   * @returns Promise<Session[]> - Array session milik user
   */
  async findByUserId(userId: number): Promise<Session[]> {
    return this.executeWithErrorHandling('find sessions by user ID', async () => {
      return await db!.select().from(sessions).where(eq(sessions.userId, userId));
    });
  }

  /**
   * Mencari session yang masih valid (belum expired)
   * @param refreshToken - Refresh token yang dicari
   * @returns Promise<Session | undefined> - Session valid jika ditemukan
   */
  async findValidSession(refreshToken: string): Promise<Session | undefined> {
    return this.executeWithErrorHandling('find valid session', async () => {
      const now = new Date();
      const result = await db!.select().from(sessions)
        .where(
          and(
            eq(sessions.refreshToken, refreshToken),
            gt(sessions.expiresAt, now)
          )
        )
        .limit(1);
      return this.getFirstResult(result);
    });
  }

  /**
   * Membuat session baru
   * @param sessionData - Data session baru
   * @returns Promise<Session> - Session yang baru dibuat
   */
  async create(sessionData: NewSession): Promise<Session> {
    return this.executeWithErrorHandling('create session', async () => {
      const result = await db!.insert(sessions).values(sessionData).returning();
      const newSession = this.getFirstResult(result);
      if (!newSession) {
        throw new Error('Failed to create session - no data returned');
      }
      return newSession;
    });
  }

  /**
   * Mengupdate data session
   * @param id - ID session yang akan diupdate
   * @param sessionData - Data session yang akan diupdate
   * @returns Promise<Session | undefined> - Session yang sudah diupdate atau undefined jika tidak ditemukan
   */
  async update(id: number, sessionData: Partial<Omit<Session, 'id' | 'createdAt'>>): Promise<Session | undefined> {
    return this.executeWithErrorHandling('update session', async () => {
      const result = await db!.update(sessions)
        .set(sessionData)
        .where(eq(sessions.id, id))
        .returning();
      return this.getFirstResult(result);
    });
  }

  /**
   * Menghapus session berdasarkan ID
   * @param id - ID session yang akan dihapus
   * @returns Promise<boolean> - true jika berhasil, false jika tidak
   */
  async delete(id: number): Promise<boolean> {
    return this.executeWithErrorHandling('delete session', async () => {
      const result = await db!.delete(sessions).where(eq(sessions.id, id));
      return this.isOperationSuccessful(result.rowCount || 0);
    });
  }

  /**
   * Menghapus session berdasarkan refresh token
   * @param refreshToken - Refresh token session yang akan dihapus
   * @returns Promise<boolean> - true jika berhasil, false jika tidak
   */
  async deleteByRefreshToken(refreshToken: string): Promise<boolean> {
    return this.executeWithErrorHandling('delete session by refresh token', async () => {
      const result = await db!.delete(sessions).where(eq(sessions.refreshToken, refreshToken));
      return this.isOperationSuccessful(result.rowCount || 0);
    });
  }

  /**
   * Menghapus semua session milik user
   * @param userId - ID user yang session-nya akan dihapus
   * @returns Promise<boolean> - true jika berhasil, false jika tidak
   */
  async deleteByUserId(userId: number): Promise<boolean> {
    return this.executeWithErrorHandling('delete sessions by user ID', async () => {
      const result = await db!.delete(sessions).where(eq(sessions.userId, userId));
      return this.isOperationSuccessful(result.rowCount || 0);
    });
  }

  /**
   * Menghapus session yang sudah expired
   * @returns Promise<number> - Jumlah session yang dihapus
   */
  async deleteExpiredSessions(): Promise<number> {
    return this.executeWithErrorHandling('delete expired sessions', async () => {
      const now = new Date();
      const result = await db!.delete(sessions).where(gt(sessions.expiresAt, now));
      return result.rowCount || 0;
    });
  }
}

// Export instance untuk backward compatibility
export const sessionRepository = new SessionRepository("SessionRepository");
