import { BaseCrudService } from "../base/baseService";
import { userRepository } from "@/repositories";
import { NotFoundError, ConflictError } from "@/lib/errors/errorHandler";
import type { User, UserCreateInput } from "./types";

/**
 * User CRUD Service yang menangani operasi CRUD dasar untuk user
 * Menerapkan Single Responsibility Principle - hanya menangani operasi CRUD
 * Mengextend BaseCrudService untuk konsistensi dan DRY principle
 */
export class UserCrudService extends BaseCrudService<User, UserCreateInput, Partial<UserCreateInput>> {
  constructor() {
    super();
  }

  /**
   * Mendapatkan semua user
   * @returns Promise<User[]> - Array semua user
   */
  async getAll(): Promise<User[]> {
    return this.executeWithErrorHandling(
      'get all users',
      () => userRepository.findAll()
    );
  }

  /**
   * Mendapatkan user berdasarkan ID
   * @param id - ID user
   * @returns Promise<User | null> - User atau null jika tidak ditemukan
   */
  async getById(id: number): Promise<User | null> {
    return this.executeWithErrorHandling(
      'get user by id',
      async () => {
        const user = await userRepository.findById(id);
        return user || null;
      }
    );
  }

  /**
   * Membuat user baru
   * Business rules:
   * - Email harus unik
   * @param userData - Data user untuk dibuat
   * @returns Promise<User> - User yang berhasil dibuat
   */
  async create(userData: UserCreateInput): Promise<User> {
    return this.executeWithErrorHandling(
      'create user',
      async () => {
        // Cek apakah email sudah terdaftar
        const existingUser = await userRepository.findByEmail(userData.email);
        if (existingUser) {
          throw new ConflictError('User', 'email', userData.email);
        }

        // Siapkan data user dengan password hash
        const userDataToCreate = {
          name: userData.name,
          email: userData.email,
          passwordHash: userData.password, // Akan di-hash di repository
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Buat user baru
        const newUser = await userRepository.create(userDataToCreate);
        return newUser;
      }
    );
  }

  /**
   * Update user
   * @param id - ID user
   * @param data - Data yang akan diupdate
   * @returns Promise<User | null> - User yang sudah diupdate
   */
  async update(id: number, data: Partial<UserCreateInput>): Promise<User | null> {
    return this.executeWithErrorHandling(
      'update user',
      async () => {
        const existingUser = await userRepository.findById(id);
        if (!existingUser) {
          throw new NotFoundError('User', id);
        }

        // Jika email diubah, cek apakah email baru sudah ada
        if (data.email) {
          const userWithEmail = await userRepository.findByEmail(data.email);
          if (userWithEmail && userWithEmail.id !== id) {
            throw new ConflictError('User', 'email', data.email);
          }
        }

        const updatedUser = await userRepository.update(id, data);
        return updatedUser || null;
      }
    );
  }

  /**
   * Hapus user
   * @param id - ID user
   * @returns Promise<boolean> - true jika berhasil dihapus
   */
  async delete(id: number): Promise<boolean> {
    return this.executeWithErrorHandling(
      'delete user',
      async () => {
        const existingUser = await userRepository.findById(id);
        if (!existingUser) {
          throw new NotFoundError('User', id);
        }
        return userRepository.delete(id);
      }
    );
  }

  /**
   * Mendapatkan semua user yang aktif
   * @returns Promise<User[]> - Array user yang aktif
   */
  async getActiveUsers(): Promise<User[]> {
    return this.executeWithErrorHandling(
      'get active users',
      async () => {
        const users = await userRepository.findAll();
        return users.filter(user => user.active);
      }
    );
  }

  /**
   * Mendapatkan user berdasarkan email
   * @param email - Email user
   * @returns Promise<User | null> - User atau null jika tidak ditemukan
   */
  async getByEmail(email: string): Promise<User | null> {
    return this.executeWithErrorHandling(
      'get user by email',
      async () => {
        const user = await userRepository.findByEmail(email);
        return user || null;
      }
    );
  }

  /**
   * Deaktivasi user
   * @param userId - ID user yang akan dinonaktifkan
   * @returns Promise<boolean> - true jika berhasil dinonaktifkan
   */
  async deactivateUser(userId: number): Promise<boolean> {
    return this.executeWithErrorHandling(
      'deactivate user',
      async () => {
        const existingUser = await userRepository.findById(userId);
        if (!existingUser) {
          throw new NotFoundError('User', userId);
        }
        const result = await userRepository.deactivate(userId);
        return !!result; // Convert to boolean
      }
    );
  }

  /**
   * Mendapatkan jumlah total user
   * @returns Promise<number> - Jumlah total user
   */
  async count(): Promise<number> {
    return this.executeWithErrorHandling(
      'count users',
      () => userRepository.count()
    );
  }
}

// Export instance untuk digunakan di service lain
export const userCrudService = new UserCrudService();