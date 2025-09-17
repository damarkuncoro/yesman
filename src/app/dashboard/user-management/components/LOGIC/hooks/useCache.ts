import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Interface untuk cache entry
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

/**
 * Interface untuk cache configuration
 */
export interface CacheConfig {
  ttl?: number // Time to live dalam milliseconds
  maxSize?: number // Maksimum jumlah entries dalam cache
  enablePersistence?: boolean // Simpan ke localStorage
}

/**
 * Interface untuk return value useCache
 */
export interface UseCacheReturn<T> {
  get: (key: string) => T | null
  set: (key: string, data: T, customTtl?: number) => void
  remove: (key: string) => void
  clear: () => void
  has: (key: string) => boolean
  isExpired: (key: string) => boolean
  size: number
}

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_CONFIG: Required<CacheConfig> = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  enablePersistence: false
}

/**
 * Custom hook untuk mengelola caching dengan TTL dan persistence
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 * Hook ini hanya bertanggung jawab untuk mengelola cache operations
 * 
 * Menerapkan prinsip DRY dengan reusable caching logic
 * Menerapkan prinsip Open/Closed dengan konfigurasi yang dapat diperluas
 * 
 * @param config - Konfigurasi cache
 * @returns Object dengan cache operations
 */
export function useCache<T = any>(config: CacheConfig = {}): UseCacheReturn<T> {
  const finalConfig = { ...DEFAULT_CACHE_CONFIG, ...config }
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map())
  const [size, setSize] = useState(0)

  /**
   * Load cache dari localStorage jika persistence enabled
   */
  useEffect(() => {
    if (finalConfig.enablePersistence) {
      try {
        const stored = localStorage.getItem('app-cache')
        if (stored) {
          const parsedCache = JSON.parse(stored)
          Object.entries(parsedCache).forEach(([key, entry]) => {
            cacheRef.current.set(key, entry as CacheEntry<T>)
          })
          setSize(cacheRef.current.size)
        }
      } catch (error) {
        console.warn('Failed to load cache from localStorage:', error)
      }
    }
  }, [finalConfig.enablePersistence])

  /**
   * Save cache ke localStorage jika persistence enabled
   */
  const persistCache = useCallback(() => {
    if (finalConfig.enablePersistence) {
      try {
        const cacheObject = Object.fromEntries(cacheRef.current.entries())
        localStorage.setItem('app-cache', JSON.stringify(cacheObject))
      } catch (error) {
        console.warn('Failed to persist cache to localStorage:', error)
      }
    }
  }, [finalConfig.enablePersistence])

  /**
   * Check apakah cache entry sudah expired
   */
  const isExpired = useCallback((key: string): boolean => {
    const entry = cacheRef.current.get(key)
    if (!entry) return true
    
    return Date.now() - entry.timestamp > entry.ttl
  }, [])

  /**
   * Get data dari cache
   */
  const get = useCallback((key: string): T | null => {
    const entry = cacheRef.current.get(key)
    
    if (!entry) return null
    
    // Check TTL
    if (isExpired(key)) {
      cacheRef.current.delete(key)
      setSize(cacheRef.current.size)
      persistCache()
      return null
    }
    
    return entry.data
  }, [isExpired, persistCache])

  /**
   * Set data ke cache dengan TTL
   */
  const set = useCallback((key: string, data: T, customTtl?: number): void => {
    const ttl = customTtl || finalConfig.ttl
    
    // Check max size dan remove oldest entry jika perlu
    if (cacheRef.current.size >= finalConfig.maxSize && !cacheRef.current.has(key)) {
      const firstKey = cacheRef.current.keys().next().value
      if (firstKey) {
        cacheRef.current.delete(firstKey)
      }
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    }
    
    cacheRef.current.set(key, entry)
    setSize(cacheRef.current.size)
    persistCache()
  }, [finalConfig.ttl, finalConfig.maxSize, persistCache])

  /**
   * Remove specific cache entry
   */
  const remove = useCallback((key: string): void => {
    cacheRef.current.delete(key)
    setSize(cacheRef.current.size)
    persistCache()
  }, [persistCache])

  /**
   * Clear semua cache
   */
  const clear = useCallback((): void => {
    cacheRef.current.clear()
    setSize(0)
    if (finalConfig.enablePersistence) {
      localStorage.removeItem('app-cache')
    }
  }, [finalConfig.enablePersistence])

  /**
   * Check apakah key ada di cache
   */
  const has = useCallback((key: string): boolean => {
    return cacheRef.current.has(key) && !isExpired(key)
  }, [isExpired])

  return {
    get,
    set,
    remove,
    clear,
    has,
    isExpired,
    size
  }
}