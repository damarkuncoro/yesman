import { useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient, ApiResponse } from '../apiClient'
import { useCache, CacheConfig } from './useCache'

/**
 * Interface untuk retry configuration
 */
export interface RetryConfig {
  attempts: number
  delay: number
  backoff?: 'linear' | 'exponential'
}

/**
 * Interface untuk konfigurasi API call
 */
export interface ApiCallConfig<T> {
  endpoint?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  headers?: Record<string, string>
  errorMessage?: string
  transform?: (data: any) => T
  cacheKey?: string
  cacheConfig?: CacheConfig
  retryConfig?: RetryConfig
  fallbackData?: T
}

/**
 * Interface untuk return value useApiCall
 */
export interface UseApiCallReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  execute: (config?: Partial<ApiCallConfig<T>>) => Promise<T | null>
  reset: () => void
  retry: () => Promise<T | null>
  clearCache: () => void
}

/**
 * Base hook untuk menangani API calls dengan loading state, error handling, caching, dan retry
 * Mengikuti prinsip DRY dan Single Responsibility Principle
 * 
 * @param defaultConfig - Konfigurasi default untuk API call
 * @returns Object dengan data, loading state, error, dan method execute
 */
export function useApiCall<T = any>(defaultConfig?: Partial<ApiCallConfig<T>>): UseApiCallReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastConfig, setLastConfig] = useState<Partial<ApiCallConfig<T>> | null>(null)
  const { accessToken } = useAuth()

  // Initialize cache dengan konfigurasi default
  const cache = useCache<T>(defaultConfig?.cacheConfig)

  // Memoize defaultConfig untuk mencegah infinite re-render
  // Menggunakan deep comparison yang lebih stabil
  const memoizedDefaultConfig = useMemo(() => {
    return defaultConfig || {}
  }, [
    defaultConfig?.endpoint,
    defaultConfig?.method,
    defaultConfig?.errorMessage,
    defaultConfig?.cacheKey,
    defaultConfig?.cacheConfig?.ttl,
    defaultConfig?.retryConfig?.attempts,
    defaultConfig?.retryConfig?.delay,
    defaultConfig?.retryConfig?.backoff
  ])

  /**
   * Calculate delay untuk retry dengan backoff strategy
   */
  const calculateDelay = useCallback((attempt: number, baseDelay: number, backoff: 'linear' | 'exponential' = 'linear'): number => {
    if (backoff === 'exponential') {
      return baseDelay * Math.pow(2, attempt - 1)
    }
    return baseDelay * attempt
  }, [])

  /**
   * Execute API call dengan retry mechanism
   */
  const executeWithRetry = useCallback(async (config: ApiCallConfig<T>, attempt: number = 1): Promise<T | null> => {
    try {
      const response = await apiClient<ApiResponse<any>>(`/api${config.endpoint}`, {
        method: config.method || 'GET',
        body: config.body,
        token: accessToken || undefined,
        headers: config.headers
      })

      let result = response.data
      
      // Transform data jika ada transform function
      if (config.transform) {
        result = config.transform(result)
      }

      return result
    } catch (err) {
      const retryConfig = config.retryConfig
      
      // Retry jika masih ada attempts tersisa
      if (retryConfig && attempt < retryConfig.attempts) {
        const delay = calculateDelay(attempt, retryConfig.delay, retryConfig.backoff)
        
        console.log(`API call failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retryConfig.attempts})`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return executeWithRetry(config, attempt + 1)
      }
      
      throw err
    }
  }, [accessToken, calculateDelay])

  /**
   * Reset state ke kondisi awal
   */
  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
    setLastConfig(null)
  }, [])

  /**
   * Clear cache untuk specific key atau semua cache
   */
  const clearCache = useCallback((key?: string) => {
    if (key) {
      cache.remove(key)
    } else {
      cache.clear()
    }
  }, [cache])

  /**
   * Execute API call dengan konfigurasi yang diberikan
   */
  const execute = useCallback(async (config?: Partial<ApiCallConfig<T>>): Promise<T | null> => {
    const finalConfig = { ...memoizedDefaultConfig, ...config } as ApiCallConfig<T>
    
    if (!finalConfig.endpoint) {
      const errorMsg = 'Endpoint is required'
      setError(errorMsg)
      return null
    }

    if (!accessToken) {
      const errorMsg = 'Access token is required'
      setError(errorMsg)
      return null
    }

    // Set last config hanya setelah validasi berhasil
    setLastConfig(finalConfig)

    // Check cache untuk GET requests
    if (finalConfig.cacheKey && (finalConfig.method === 'GET' || !finalConfig.method)) {
      const cachedData = cache.get(finalConfig.cacheKey)
      if (cachedData) {
        setData(cachedData)
        setError(null)
        return cachedData
      }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await executeWithRetry(finalConfig)
      
      // Cache result untuk GET requests
      if (result && finalConfig.cacheKey && (finalConfig.method === 'GET' || !finalConfig.method)) {
        cache.set(finalConfig.cacheKey, result)
      }
      
      setData(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      const finalErrorMessage = finalConfig.errorMessage || errorMessage
      
      setError(finalErrorMessage)
      console.error('API call failed:', err)
      
      // Return fallback data jika ada
      if (finalConfig.fallbackData !== undefined) {
        setData(finalConfig.fallbackData)
        return finalConfig.fallbackData
      }
      
      return null
    } finally {
      setLoading(false)
    }
  }, [accessToken, cache, executeWithRetry])

  /**
   * Retry last API call
   */
  const retry = useCallback(async (): Promise<T | null> => {
    if (!lastConfig) {
      console.warn('No previous API call to retry')
      return null
    }
    
    return execute(lastConfig)
  }, [lastConfig, execute])

  return {
    data,
    loading,
    error,
    execute,
    reset,
    retry,
    clearCache
  }
}