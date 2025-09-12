import { db } from "@/db";

/**
 * Abstract base repository class yang menyediakan fungsionalitas umum
 * Mengikuti prinsip DRY dan SOLID - Single Responsibility Principle
 */
export abstract class BaseRepository {
  /**
   * Memvalidasi bahwa database telah diinisialisasi
   * @throws Error jika database tidak tersedia
   */
  protected validateDatabase(): void {
    if (!db) {
      throw new Error('Database not initialized');
    }
  }

  /**
   * Menangani error database dengan logging dan transformasi
   * @param error - Error yang terjadi
   * @param operation - Nama operasi yang gagal
   * @throws Error dengan pesan yang lebih informatif
   */
  protected handleDatabaseError(error: unknown, operation: string): never {
    console.error(`Database error in ${operation}:`, error);
    
    if (error instanceof Error) {
      throw new Error(`Failed to ${operation}: ${error.message}`);
    }
    
    throw new Error(`Failed to ${operation}: Unknown error occurred`);
  }

  /**
   * Wrapper untuk operasi database dengan error handling otomatis
   * @param operation - Nama operasi untuk logging
   * @param dbOperation - Fungsi operasi database
   * @returns Promise dengan hasil operasi
   */
  protected async executeWithErrorHandling<T>(
    operation: string,
    dbOperation: () => Promise<T>
  ): Promise<T> {
    try {
      this.validateDatabase();
      return await dbOperation();
    } catch (error) {
      return this.handleDatabaseError(error, operation);
    }
  }

  /**
   * Mengambil item pertama dari array hasil query
   * @param results - Array hasil query
   * @returns Item pertama atau undefined
   */
  protected getFirstResult<T>(results: T[]): T | undefined {
    return results[0];
  }

  /**
   * Memvalidasi bahwa operasi berhasil (affected rows > 0)
   * @param affectedRows - Jumlah baris yang terpengaruh
   * @returns true jika berhasil, false jika tidak
   */
  protected isOperationSuccessful(affectedRows: number): boolean {
    return affectedRows > 0;
  }
}

/**
 * Interface untuk repository yang mendukung operasi CRUD dasar
 */
export interface CrudRepository<T, TNew, TUpdate = Partial<Omit<T, 'id' | 'createdAt'>>> {
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T | undefined>;
  create(data: TNew): Promise<T>;
  update(id: number, data: TUpdate): Promise<T | undefined>;
  delete(id: number): Promise<boolean>;
}

/**
 * Interface untuk repository yang mendukung pencarian berdasarkan nama
 */
export interface NamedRepository<T> {
  findByName(name: string): Promise<T | undefined>;
}

/**
 * Interface untuk repository yang mendukung operasi count
 */
export interface CountableRepository {
  count(): Promise<number>;
}