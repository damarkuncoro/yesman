import type { ApiResponse, RequestOptions, HttpMethod } from "../types";
import { handleUnauthorizedRedirect } from "../auth/authRedirectUtils";
import { RefreshTokenService } from "../auth/refreshTokenService";
import { TokenService } from "../auth/tokenService";

/**
 * Interface untuk HTTP client configuration
 */
interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  defaultHeaders?: Record<string, string>;
}

/**
 * Interface untuk request interceptor
 */
interface RequestInterceptor {
  (config: RequestInit & { url: string }): RequestInit & { url: string } | Promise<RequestInit & { url: string }>;
}

/**
 * Interface untuk response interceptor
 */
interface ResponseInterceptor {
  (response: Response): Response | Promise<Response>;
}

/**
 * HTTP Client yang robust dengan interceptors dan retry logic
 * Mengikuti prinsip Single Responsibility dan Open/Closed Principle
 */
export class HttpClient {
  private config: HttpClientConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
      ...config,
    };
  }

  /**
   * Menambahkan request interceptor
   * @param interceptor - Function yang akan dijalankan sebelum request
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Menambahkan response interceptor
   * @param interceptor - Function yang akan dijalankan setelah response
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Mengambil stored token dari localStorage
   * @returns Token atau null jika tidak ada
   */
  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  /**
   * Membuat request dengan retry logic dan interceptors
   * @param url - URL endpoint
   * @param options - Request options
   * @returns Promise dengan response data
   */
  private async makeRequest<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { requireAuth = true, ...requestOptions } = options;
    
    // Prepare request config
    let requestConfig: RequestInit & { url: string } = {
      url: this.config.baseURL ? `${this.config.baseURL}${url}` : url,
      headers: {
        ...this.config.defaultHeaders,
        ...requestOptions.headers,
      },
      ...requestOptions,
    };

    // Add authentication header if required
    if (requireAuth) {
      const token = this.getStoredToken();
      if (token) {
        (requestConfig.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }

    // Process body if exists
    if (requestConfig.body && typeof requestConfig.body === 'object') {
      requestConfig.body = JSON.stringify(requestConfig.body);
    }

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      requestConfig = await interceptor(requestConfig);
    }

    // Execute request with retry logic
    let lastError: Error;
    for (let attempt = 0; attempt <= this.config.retries!; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        let response = await fetch(requestConfig.url, {
          ...requestConfig,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        // Apply response interceptors
        for (const interceptor of this.responseInterceptors) {
          response = await interceptor(response);
        }

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return data;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx) or last attempt
        if (attempt === this.config.retries || 
            (error as any).status >= 400 && (error as any).status < 500) {
          break;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay! * (attempt + 1)));
      }
    }

    throw lastError!;
  }

  /**
   * GET request
   */
  async get<T>(url: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(url: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T>(url: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'PATCH', body });
  }
}

// Default HTTP client instances
export const httpClient = new HttpClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
});

export const publicHttpClient = new HttpClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
});

// Add default interceptors
httpClient.addRequestInterceptor(async (config) => {
  // Skip token validation untuk public endpoints
  if (config.url?.includes('/auth/login') || 
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/refresh') ||
      (config as any).requireAuth === false) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url} (public)`);
    }
    return config;
  }

  // Untuk authenticated requests, pastikan token valid
  try {
    const validToken = await RefreshTokenService.ensureValidToken();
    
    // Update authorization header dengan token yang valid
    if (validToken) {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${validToken}`;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url} (authenticated)`);
    }
    
    return config;
  } catch (error) {
    console.error('❌ Token validation failed:', error);
    
    // Clear tokens dan redirect ke login
    TokenService.clearTokens();
    handleUnauthorizedRedirect({
      loginUrl: '/login',
      preserveCurrentPath: true,
      clearTokens: true
    });
    
    throw error;
  }
});

httpClient.addResponseInterceptor(async (response) => {
  // Log responses in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ ${response.status} ${response.url}`);
  }
  
  // Jika masih ada 401/403 setelah request interceptor, berarti refresh gagal
  if (response.status === 401 || response.status === 403) {
    console.error('❌ Authentication failed after token validation');
    TokenService.clearTokens();
    
    // Cek apakah ada header redirect dari server
    const redirectTo = response.headers.get('X-Redirect-To');
    const redirectReason = response.headers.get('X-Redirect-Reason');
    
    if (redirectTo && redirectReason === 'token-not-found') {
      console.log('🔄 Token tidak ditemukan, redirecting to login...');
      handleUnauthorizedRedirect({
        loginUrl: redirectTo,
        preserveCurrentPath: true,
        clearTokens: true
      });
    } else {
      handleUnauthorizedRedirect({
        loginUrl: '/login',
        preserveCurrentPath: true,
        clearTokens: true
      });
    }
  }
  
  return response;
});

// Backward compatibility exports
export const api = httpClient;
export const publicApi = publicHttpClient;