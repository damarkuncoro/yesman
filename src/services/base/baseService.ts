import { z } from "zod";

/**
 * Interface untuk service yang memiliki operasi CRUD dasar
 * Menerapkan Interface Segregation Principle (ISP)
 */
export interface CrudService<T, CreateInput, UpdateInput = Partial<CreateInput>> {
  getAll(): Promise<T[]>;
  getById(id: number): Promise<T | null>;
  create(data: CreateInput): Promise<T>;
  update(id: number, data: UpdateInput): Promise<T | null>;
  delete(id: number): Promise<boolean>;
}

/**
 * Interface untuk service yang memiliki validasi
 * Menerapkan Interface Segregation Principle (ISP)
 */
export interface ValidatableService {
  validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T;
}

/**
 * Interface untuk service yang memiliki error handling
 * Menerapkan Interface Segregation Principle (ISP)
 */
export interface ErrorHandlingService {
  handleError(operation: string, error: unknown): never;
}

/**
 * Base service class yang mengimplementasikan common functionality
 * Menerapkan DRY principle dan Single Responsibility Principle
 */
export abstract class BaseService implements ValidatableService, ErrorHandlingService {
  /**
   * Validasi input menggunakan Zod schema
   * @param schema - Zod schema untuk validasi
   * @param data - Data yang akan divalidasi
   * @returns Data yang sudah divalidasi
   * @throws Error jika validasi gagal
   */
  validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map((err: z.ZodIssue) => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        throw new Error(`Validation error: ${errorMessages}`);
      }
      throw error;
    }
  }

  /**
   * Handle error dengan format yang konsisten
   * @param operation - Nama operasi yang sedang dilakukan
   * @param error - Error yang terjadi
   * @throws Error dengan format yang konsisten
   */
  handleError(operation: string, error: unknown): never {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error in ${operation}:`, error);
    throw new Error(`Failed to ${operation}: ${errorMessage}`);
  }

  /**
   * Execute operation dengan error handling yang konsisten
   * @param operation - Nama operasi
   * @param fn - Function yang akan dieksekusi
   * @returns Result dari function
   */
  protected async executeWithErrorHandling<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.handleError(operation, error);
    }
  }

  /**
   * Validasi bahwa entity exists
   * @param entity - Entity yang akan dicek
   * @param entityName - Nama entity untuk error message
   * @param id - ID entity
   * @throws Error jika entity tidak ditemukan
   */
  protected validateEntityExists<T>(
    entity: T | null | undefined,
    entityName: string,
    id: number | string
  ): asserts entity is T {
    if (!entity) {
      throw new Error(`${entityName} dengan ID ${id} tidak ditemukan`);
    }
  }

  /**
   * Validasi bahwa entity tidak exists (untuk create operations)
   * @param entity - Entity yang akan dicek
   * @param entityName - Nama entity untuk error message
   * @param identifier - Identifier yang digunakan untuk pencarian
   * @throws Error jika entity sudah ada
   */
  protected validateEntityNotExists<T>(
    entity: T | null | undefined,
    entityName: string,
    identifier: string
  ): void {
    if (entity) {
      throw new Error(`${entityName} dengan ${identifier} sudah ada`);
    }
  }

  /**
   * Sanitize data dengan menghapus field yang sensitive
   * @param data - Data yang akan disanitize
   * @param fieldsToRemove - Field yang akan dihapus
   * @returns Data yang sudah disanitize
   */
  protected sanitizeData<T extends Record<string, unknown>>(
    data: T,
    fieldsToRemove: (keyof T)[]
  ): Omit<T, keyof T> {
    const sanitized = { ...data };
    fieldsToRemove.forEach(field => {
      delete sanitized[field];
    });
    return sanitized;
  }
}

/**
 * Abstract CRUD service yang mengextend BaseService
 * Menerapkan Template Method Pattern
 */
export abstract class BaseCrudService<T, CreateInput, UpdateInput = Partial<CreateInput>> 
  extends BaseService 
  implements CrudService<T, CreateInput, UpdateInput> {
  
  abstract getAll(): Promise<T[]>;
  abstract getById(id: number): Promise<T | null>;
  abstract create(data: CreateInput): Promise<T>;
  abstract update(id: number, data: UpdateInput): Promise<T | null>;
  abstract delete(id: number): Promise<boolean>;

  /**
   * Template method untuk create operation dengan validasi
   * @param schema - Schema untuk validasi
   * @param data - Data yang akan dibuat
   * @returns Entity yang dibuat
   */
  protected async createWithValidation<TInput>(
    schema: z.ZodSchema<TInput>,
    data: unknown
  ): Promise<T> {
    const validatedData = this.validateInput(schema, data);
    return this.executeWithErrorHandling(
      'create entity',
      () => this.create(validatedData as unknown as CreateInput)
    );
  }

  /**
   * Template method untuk update operation dengan validasi
   * @param schema - Schema untuk validasi
   * @param id - ID entity yang akan diupdate
   * @param data - Data yang akan diupdate
   * @returns Entity yang diupdate
   */
  protected async updateWithValidation<TInput>(
    schema: z.ZodSchema<TInput>,
    id: number,
    data: unknown
  ): Promise<T> {
    const validatedData = this.validateInput(schema, data);
    const result = await this.executeWithErrorHandling(
      'update entity',
      () => this.update(id, validatedData as unknown as UpdateInput)
    );
    this.validateEntityExists(result, 'Entity', id);
    return result;
  }

  /**
   * Template method untuk get by id dengan validasi exists
   * @param id - ID entity
   * @returns Entity yang ditemukan
   */
  protected async getByIdWithValidation(id: number): Promise<T> {
    const entity = await this.executeWithErrorHandling(
      'get entity by id',
      () => this.getById(id)
    );
    this.validateEntityExists(entity, 'Entity', id);
    return entity;
  }
}