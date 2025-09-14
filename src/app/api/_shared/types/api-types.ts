/**
 * API Types
 * Interface dan type untuk response API dan request context
 * Menerapkan Single Responsibility Principle (SRP)
 */

/**
 * Interface untuk response API yang konsisten di seluruh aplikasi
 * Menerapkan Interface Segregation Principle (ISP)
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Interface untuk request context (logging dan debugging)
 */
export interface RequestContext {
  userAgent?: string | null;
  ip: string;
  endpoint: string;
  timestamp: string;
  [key: string]: any;
}