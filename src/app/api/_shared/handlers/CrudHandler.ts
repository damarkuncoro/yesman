import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "./BaseApiHandler";
import type { HandlerConfig } from "../types";
import { ResponseBuilder } from "../builders/ResponseBuilder";
import { RequestHandler } from "./RequestHandler";

/**
 * HTTP Methods yang didukung
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Interface untuk CRUD operation configuration
 */
export interface CrudOperation<TInput = any, TOutput = any> {
  method: HttpMethod;
  handler: (request: NextRequest, input?: TInput) => Promise<TOutput>;
  requireAuth?: boolean;
  validateInput?: boolean;
  errorMessage?: string;
}

/**
 * Configuration untuk CRUD handler
 */
export interface CrudHandlerConfig extends HandlerConfig {
  operations: Record<HttpMethod, CrudOperation>;
}

/**
 * Universal CRUD Handler yang mendukung semua HTTP methods
 * Mengimplementasikan Strategy Pattern untuk different operations
 * Menggunakan shared components untuk konsistensi
 */
export class CrudHandler extends BaseApiHandler {
  private operations: Record<HttpMethod, CrudOperation>;
  private responseBuilder: ResponseBuilder;
  private requestHandler: RequestHandler;

  constructor(operations: Record<string, CrudOperation>) {
    super({ requireAuth: true });
    this.operations = operations as Record<HttpMethod, CrudOperation>;
    this.responseBuilder = new ResponseBuilder();
    this.requestHandler = new RequestHandler();
  }

  /**
   * Route handler berdasarkan HTTP method
   * Menggunakan shared RequestHandler untuk parsing input
   */
  protected async execute(request: NextRequest): Promise<any> {
    const method = request.method as HttpMethod;
    const operation = this.operations[method];

    if (!operation) {
      throw new Error(`HTTP method ${method} tidak didukung untuk endpoint ini`);
    }

    // Get input data untuk POST/PUT/PATCH menggunakan shared RequestHandler
    let inputData;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const result = await this.requestHandler.parseAndValidate(request);
      if (!result.success) {
        throw new Error('Invalid request data: ' + result.error);
      }
      inputData = result.data;
    }

    // Execute operation
    return await operation.handler(request, inputData);
  }

  /**
   * Override authorization untuk per-operation auth requirements
   */
  protected async authorize(request: NextRequest): Promise<NextResponse | void> {
    const method = request.method as HttpMethod;
    const operation = this.operations[method];

    // Skip auth jika operation tidak memerlukan auth
    if (operation && operation.requireAuth === false) {
      return;
    }

    return super.authorize(request);
  }

  /**
   * Override error response formatting untuk CRUD operations
   * Menggunakan shared ResponseBuilder untuk konsistensi
   */
  protected formatErrorResponse(error: unknown): NextResponse {
    console.error('CRUD Operation Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada operasi CRUD';
    
    // Determine response type based on error message
    if (errorMessage.includes('tidak didukung')) {
      return this.responseBuilder.error('HTTP method tidak didukung untuk endpoint ini', 405);
    } else if (errorMessage.includes('tidak ditemukan')) {
      return this.responseBuilder.notFound('Resource');
    } else if (errorMessage.includes('tidak valid') || errorMessage.includes('Invalid')) {
      return this.responseBuilder.validationError([errorMessage]);
    }
    
    return this.responseBuilder.error(errorMessage);
  }

  /**
   * Helper untuk mendapatkan method dari error context
   */
  private getMethodFromError(): string | null {
    // Implementasi sederhana - bisa diperbaiki dengan context yang lebih baik
    return null;
  }
}

/**
 * Builder class untuk membuat CRUD handler dengan fluent interface
 * Mengimplementasikan Builder Pattern
 */
export class CrudHandlerBuilder {
  private operations: Record<string, CrudOperation> = {};

  /**
   * Tambahkan GET operation
   */
  get(handler: (request: NextRequest) => Promise<any>, options?: Partial<CrudOperation>): this {
    this.operations.GET = {
      method: 'GET',
      handler,
      requireAuth: true,
      validateInput: false,
      errorMessage: 'Terjadi kesalahan saat mengambil data',
      ...options
    };
    return this;
  }

  /**
   * Tambahkan POST operation
   */
  post<T>(handler: (request: NextRequest, input: T) => Promise<any>, options?: Partial<CrudOperation>): this {
    this.operations.POST = {
      method: 'POST',
      handler,
      requireAuth: true,
      validateInput: true,
      errorMessage: 'Terjadi kesalahan saat membuat data',
      ...options
    };
    return this;
  }

  /**
   * Tambahkan PUT operation
   */
  put<T>(handler: (request: NextRequest, input: T) => Promise<any>, options?: Partial<CrudOperation>): this {
    this.operations.PUT = {
      method: 'PUT',
      handler,
      requireAuth: true,
      validateInput: true,
      errorMessage: 'Terjadi kesalahan saat mengupdate data',
      ...options
    };
    return this;
  }

  /**
   * Tambahkan DELETE operation
   */
  delete(handler: (request: NextRequest) => Promise<any>, options?: Partial<CrudOperation>): this {
    this.operations.DELETE = {
      method: 'DELETE',
      handler,
      requireAuth: true,
      validateInput: false,
      errorMessage: 'Terjadi kesalahan saat menghapus data',
      ...options
    };
    return this;
  }

  /**
   * Tambahkan PATCH operation
   */
  patch<T>(handler: (request: NextRequest, input: T) => Promise<any>, options?: Partial<CrudOperation>): this {
    this.operations.PATCH = {
      method: 'PATCH',
      handler,
      requireAuth: true,
      validateInput: true,
      errorMessage: 'Terjadi kesalahan saat mengupdate data',
      ...options
    };
    return this;
  }

  /**
   * Build CRUD handler
   */
  build(): CrudHandler {
    if (Object.keys(this.operations).length === 0) {
      throw new Error('Minimal satu operation harus didefinisikan');
    }
    
    return new CrudHandler(this.operations);
  }
}

/**
 * Factory function untuk membuat CRUD handler builder
 */
export function createCrudHandler(): CrudHandlerBuilder {
  return new CrudHandlerBuilder();
}