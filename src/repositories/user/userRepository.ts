import { eq, count } from "drizzle-orm";
import { db } from "@/db";
import { users, type User, type NewUser } from "@/db/schema";
import { BaseRepository, CrudRepository, CountableRepository } from "../base/baseRepository";

/**
 * Repository untuk operasi CRUD user
 * Mengikuti prinsip Single Responsibility - hanya menangani akses data user
 * Mengextend BaseRepository untuk menghilangkan duplikasi kode
 * Dilengkapi dengan debug tracking untuk development environment
 */
export class UserRepository extends BaseRepository implements CrudRepository<User, NewUser>, CountableRepository {
  constructor() {
    super('UserRepository');
  }
  /**
   * Mengambil semua user dari database
   * @returns Promise<User[]> - Array semua user
   */
  async findAll(): Promise<User[]> {
    return this.executeWithErrorHandling('fetch all users', async () => {
      return await db!.select().from(users);
    });
  }

  /**
   * Mencari user berdasarkan ID
   * @param id - ID user yang dicari
   * @returns Promise<User | undefined> - User jika ditemukan, undefined jika tidak
   */
  async findById(id: number): Promise<User | undefined> {
    return this.executeWithErrorHandling(
      'find user by ID', 
      async () => {
        const result = await db!.select().from(users).where(eq(users.id, id)).limit(1);
        return this.getFirstResult(result);
      },
      { searchId: id },
      id
    );
  }

  /**
   * Mencari user berdasarkan email
   * @param email - Email user yang dicari
   * @returns Promise<User | undefined> - User jika ditemukan, undefined jika tidak
   */
  async findByEmail(email: string): Promise<User | undefined> {
    return this.executeWithErrorHandling(
      'find user by email', 
      async () => {
        const result = await db!.select().from(users).where(eq(users.email, email)).limit(1);
        return this.getFirstResult(result);
      },
      { searchEmail: email }
    );
  }

  /**
   * Membuat user baru
   * @param userData - Data user baru
   * @returns Promise<User> - User yang baru dibuat
   */
  async create(userData: NewUser): Promise<User> {
    return this.executeWithErrorHandling('create user', async () => {
      const result = await db!.insert(users).values(userData).returning();
      const newUser = this.getFirstResult(result);
      if (!newUser) {
        throw new Error('Failed to create user - no data returned');
      }
      return newUser;
    });
  }

  /**
   * Mengupdate data user
   * @param id - ID user yang akan diupdate
   * @param userData - Data user yang akan diupdate
   * @returns Promise<User | undefined> - User yang sudah diupdate atau undefined jika tidak ditemukan
   */
  async update(id: number, userData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined> {
    return this.executeWithErrorHandling('update user', async () => {
      console.log('🔍 UserRepository.update - Input:', { id, userData });
      
      const updateData = { ...userData, updatedAt: new Date() };
      console.log('🔍 UserRepository.update - Update data:', updateData);
      
      const result = await db!.update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();
      
      console.log('🔍 UserRepository.update - Result:', result);
      
      const firstResult = this.getFirstResult(result);
      console.log('🔍 UserRepository.update - First result:', firstResult);
      
      return firstResult;
    });
  }

  /**
   * Menonaktifkan user (soft delete)
   * @param id - ID user yang akan dinonaktifkan
   * @returns Promise<User | undefined> - User yang sudah dinonaktifkan atau undefined jika tidak ditemukan
   */
  async deactivate(id: number): Promise<User | undefined> {
    return this.update(id, { active: false });
  }

  /**
   * Mengaktifkan user
   * @param id - ID user yang akan diaktifkan
   * @returns Promise<User | undefined> - User yang sudah diaktifkan atau undefined jika tidak ditemukan
   */
  async activate(id: number): Promise<User | undefined> {
    return this.update(id, { active: true });
  }

  /**
   * Menghitung total jumlah user di database
   * @returns Promise<number> - Jumlah total user
   */
  async count(): Promise<number> {
    return this.executeWithErrorHandling('count users', async () => {
      const result = await db!.select({ count: count() }).from(users);
      return Number(result[0]?.count || 0);
    });
  }

  /**
   * Update last login timestamp untuk user (menggunakan updatedAt sebagai penanda)
   * @param id - ID user yang akan diupdate
   * @returns Promise<User | undefined> - User yang sudah diupdate atau undefined jika tidak ditemukan
   */
  async updateLastLogin(id: number): Promise<User | undefined> {
    return this.executeWithErrorHandling('update user last login', async () => {
      const result = await db!.update(users)
        .set({ updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return this.getFirstResult(result);
    });
  }

  /**
   * Menghapus user secara permanen (hard delete)
   * @param id - ID user yang akan dihapus
   * @returns Promise<boolean> - true jika berhasil, false jika tidak
   */
  async delete(id: number): Promise<boolean> {
    return this.executeWithErrorHandling('delete user', async () => {
      const result = await db!.delete(users).where(eq(users.id, id));
      return this.isOperationSuccessful(result.rowCount || 0);
    });
  }
}

// Export instance untuk backward compatibility
export const userRepository = new UserRepository();