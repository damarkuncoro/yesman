import { useState, useCallback } from 'react'

/**
 * Interface untuk loading state
 */
export interface LoadingState {
  loading: boolean
  dataLoading: boolean
  error: string | null
}

/**
 * Interface untuk return value useLoadingState
 */
export interface UseLoadingStateReturn extends LoadingState {
  setLoading: (loading: boolean) => void
  setDataLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetState: () => void
  withLoading: <T>(fn: () => Promise<T>) => Promise<T | null>
  withDataLoading: <T>(fn: () => Promise<T>) => Promise<T | null>
}

/**
 * Hook untuk mengelola loading state dan error handling
 * Mengikuti prinsip DRY dan Single Responsibility Principle
 * 
 * @param initialState - State awal untuk loading
 * @returns Object dengan loading states dan utility methods
 */
export function useLoadingState(initialState?: Partial<LoadingState>): UseLoadingStateReturn {
  const [loading, setLoadingState] = useState(initialState?.loading ?? false)
  const [dataLoading, setDataLoadingState] = useState(initialState?.dataLoading ?? false)
  const [error, setErrorState] = useState<string | null>(initialState?.error ?? null)

  /**
   * Set loading state
   */
  const setLoading = useCallback((loading: boolean) => {
    setLoadingState(loading)
    if (loading) setErrorState(null)
  }, [])

  /**
   * Set data loading state
   */
  const setDataLoading = useCallback((loading: boolean) => {
    setDataLoadingState(loading)
    if (loading) setErrorState(null)
  }, [])

  /**
   * Set error state
   */
  const setError = useCallback((error: string | null) => {
    setErrorState(error)
    if (error) {
      setLoadingState(false)
      setDataLoadingState(false)
    }
  }, [])

  /**
   * Reset semua state ke kondisi awal
   */
  const resetState = useCallback(() => {
    setLoadingState(false)
    setDataLoadingState(false)
    setErrorState(null)
  }, [])

  /**
   * Wrapper function untuk menjalankan async operation dengan loading state
   */
  const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true)
      const result = await fn()
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMsg)
      return null
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  /**
   * Wrapper function untuk menjalankan async operation dengan data loading state
   */
  const withDataLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      setDataLoading(true)
      const result = await fn()
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMsg)
      return null
    } finally {
      setDataLoading(false)
    }
  }, [setDataLoading, setError])

  return {
    loading,
    dataLoading,
    error,
    setLoading,
    setDataLoading,
    setError,
    resetState,
    withLoading,
    withDataLoading
  }
}