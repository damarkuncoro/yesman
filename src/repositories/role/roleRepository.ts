import { eq, count } from "drizzle-orm";
import { db } from "@/db";
import { roles, type Role, type NewRole } from "@/db/schema";
import { BaseRepository, CrudRepository, NamedRepository, CountableRepository } from "../base/baseRepository";

/**
 * Repository untuk operasi CRUD role
 * Mengikuti prinsip Single Responsibility - hanya menangani akses data role
 * Mengextend BaseRepository untuk menghilangkan duplikasi kode
 */
export class RoleRepository extends BaseRepository implements CrudRepository<Role, NewRole>, NamedRepository<Role>, CountableRepository {
  /**
   * Mengambil semua role dari database
   * @returns Promise<Role[]> - Array semua role
   */
  async findAll(): Promise<Role[]> {
    return this.executeWithErrorHandling('fetch all roles', async () => {
      return await db!.select().from(roles);
    });
  }

  /**
   * Mencari role berdasarkan ID
   * @param id - ID role yang dicari
   * @returns Promise<Role | undefined> - Role jika ditemukan, undefined jika tidak
   */
  async findById(id: number): Promise<Role | undefined> {
    return this.executeWithErrorHandling('find role by ID', async () => {
      const result = await db!.select().from(roles).where(eq(roles.id, id)).limit(1);
      return this.getFirstResult(result);
    });
  }

  /**
   * Mencari role berdasarkan nama
   * @param name - Nama role yang dicari
   * @returns Promise<Role | undefined> - Role jika ditemukan, undefined jika tidak
   */
  async findByName(name: string): Promise<Role | undefined> {
    return this.executeWithErrorHandling('find role by name', async () => {
      const result = await db!.select().from(roles).where(eq(roles.name, name)).limit(1);
      return this.getFirstResult(result);
    });
  }

  /**
   * Mencari role yang memberikan akses ke semua fitur (grantsAll = true)
   * @returns Promise<Role[]> - Array role dengan akses penuh
   */
  async findGrantsAllRoles(): Promise<Role[]> {
    return this.executeWithErrorHandling('find grants all roles', async () => {
      return await db!.select().from(roles).where(eq(roles.grantsAll, true));
    });
  }

  /**
   * Membuat role baru
   * @param roleData - Data role baru
   * @returns Promise<Role> - Role yang baru dibuat
   */
  async create(roleData: NewRole): Promise<Role> {
    return this.executeWithErrorHandling('create role', async () => {
      const result = await db!.insert(roles).values(roleData).returning();
      const newRole = this.getFirstResult(result);
      if (!newRole) {
        throw new Error('Failed to create role - no data returned');
      }
      return newRole;
    });
  }

  /**
   * Mengupdate data role
   * @param id - ID role yang akan diupdate
   * @param roleData - Data role yang akan diupdate
   * @returns Promise<Role | undefined> - Role yang sudah diupdate atau undefined jika tidak ditemukan
   */
  async update(id: number, roleData: Partial<Omit<Role, 'id' | 'createdAt'>>): Promise<Role | undefined> {
    return this.executeWithErrorHandling('update role', async () => {
      const result = await db!.update(roles)
        .set(roleData)
        .where(eq(roles.id, id))
        .returning();
      return this.getFirstResult(result);
    });
  }

  /**
   * Menghitung total jumlah role di database
   * @returns Promise<number> - Jumlah total role
   */
  async count(): Promise<number> {
    return this.executeWithErrorHandling('count roles', async () => {
      const result = await db!.select({ count: count() }).from(roles);
      return Number(result[0]?.count || 0);
    });
  }

  /**
   * Menghapus role secara permanen
   * @param id - ID role yang akan dihapus
   * @returns Promise<boolean> - true jika berhasil, false jika tidak
   */
  async delete(id: number): Promise<boolean> {
    return this.executeWithErrorHandling('delete role', async () => {
      const result = await db!.delete(roles).where(eq(roles.id, id));
      return this.isOperationSuccessful(result.rowCount || 0);
    });
  }

  /**
   * Mengecek apakah role dengan nama tertentu sudah ada
   * @param name - Nama role yang akan dicek
   * @returns Promise<boolean> - true jika sudah ada, false jika belum
   */
  async existsByName(name: string): Promise<boolean> {
    return this.executeWithErrorHandling('check role exists by name', async () => {
      const role = await this.findByName(name);
      return role !== undefined;
    });
  }

  /**
   * Mengecek apakah role memiliki akses penuh (grantsAll)
   * @param id - ID role yang akan dicek
   * @returns Promise<boolean> - true jika memiliki akses penuh, false jika tidak
   */
  async hasFullAccess(id: number): Promise<boolean> {
    return this.executeWithErrorHandling('check role has full access', async () => {
      const role = await this.findById(id);
      return role?.grantsAll === true;
    });
  }
}

// Export instance untuk backward compatibility
export const roleRepository = new RoleRepository();