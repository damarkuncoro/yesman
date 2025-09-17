import { useCallback, useMemo, useRef, useEffect, useState } from 'react'

/**
 * Interface untuk performance metrics
 */
export interface PerformanceMetrics {
  renderCount: number
  lastRenderTime: number
  averageRenderTime: number
  totalRenderTime: number
}

/**
 * Interface untuk debounce options
 */
export interface DebounceOptions {
  leading?: boolean
  trailing?: boolean
  maxWait?: number
}

/**
 * Hook untuk performance monitoring
 * Mengikuti prinsip Single Responsibility dengan fokus pada performance tracking
 */
export function usePerformanceMonitor(componentName?: string): PerformanceMetrics {
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0
  })

  const startTimeRef = useRef<number>(performance.now())

  // Track render performance
  useEffect(() => {
    const endTime = performance.now()
    const renderTime = endTime - startTimeRef.current
    
    metricsRef.current.renderCount += 1
    metricsRef.current.lastRenderTime = renderTime
    metricsRef.current.totalRenderTime += renderTime
    metricsRef.current.averageRenderTime = metricsRef.current.totalRenderTime / metricsRef.current.renderCount

    if (componentName && process.env.NODE_ENV === 'development') {
      console.log(`🔍 Performance [${componentName}]:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        renderCount: metricsRef.current.renderCount,
        averageTime: `${metricsRef.current.averageRenderTime.toFixed(2)}ms`
      })
    }

    startTimeRef.current = performance.now()
  })

  return metricsRef.current
}

/**
 * Hook untuk debouncing values
 * Mengikuti prinsip DRY dengan menyediakan debounce logic yang reusable
 */
export function useDebounce<T>(
  value: T,
  delay: number,
  options: DebounceOptions = {}
): T {
  const { leading = false, trailing = true } = options
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const leadingRef = useRef<boolean>(true)

  useEffect(() => {
    // Leading edge
    if (leading && leadingRef.current) {
      setDebouncedValue(value)
      leadingRef.current = false
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (trailing) {
        setDebouncedValue(value)
      }
      leadingRef.current = true
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay, leading, trailing])

  return debouncedValue
}

/**
 * Hook untuk throttling functions
 * Mengikuti prinsip Single Responsibility dengan fokus pada throttling logic
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallRef.current

    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now
      return callback(...args)
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now()
        callback(...args)
      }, delay - timeSinceLastCall)
    }
  }, [callback, delay]) as T

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return throttledCallback
}

/**
 * Hook untuk memoization dengan custom equality check
 * Mengikuti prinsip DRY dengan menyediakan memoization logic yang flexible
 */
export function useDeepMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  isEqual?: (a: any, b: any) => boolean
): T {
  const ref = useRef<{ deps: React.DependencyList; value: T } | null>(null)

  const defaultIsEqual = useCallback((a: any, b: any): boolean => {
    return JSON.stringify(a) === JSON.stringify(b)
  }, [])

  const equalityCheck = isEqual || defaultIsEqual

  if (!ref.current || !equalityCheck(ref.current.deps, deps)) {
    ref.current = {
      deps: [...deps],
      value: factory()
    }
  }

  return ref.current.value
}

/**
 * Hook untuk lazy initialization
 * Mengikuti prinsip YAGNI dengan hanya menginisialisasi ketika dibutuhkan
 */
export function useLazyRef<T>(initializer: () => T): React.MutableRefObject<T> {
  const ref = useRef<T | null>(null)
  
  if (ref.current === null) {
    ref.current = initializer()
  }
  
  return ref as React.MutableRefObject<T>
}

/**
 * Hook untuk batching updates
 * Mengikuti prinsip performance optimization dengan menggabungkan multiple updates
 */
export function useBatchedUpdates<T>(
  initialValue: T,
  batchDelay: number = 16
): [T, (updater: (prev: T) => T) => void, () => void] {
  const [value, setValue] = useState<T>(initialValue)
  const pendingUpdatesRef = useRef<((prev: T) => T)[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const batchedSetValue = useCallback((updater: (prev: T) => T) => {
    pendingUpdatesRef.current.push(updater)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setValue(currentValue => {
        let newValue = currentValue
        pendingUpdatesRef.current.forEach(update => {
          newValue = update(newValue)
        })
        pendingUpdatesRef.current = []
        return newValue
      })
    }, batchDelay)
  }, [batchDelay])

  const flushUpdates = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (pendingUpdatesRef.current.length > 0) {
      setValue(currentValue => {
        let newValue = currentValue
        pendingUpdatesRef.current.forEach(update => {
          newValue = update(newValue)
        })
        pendingUpdatesRef.current = []
        return newValue
      })
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [value, batchedSetValue, flushUpdates]
}

/**
 * Hook untuk virtual scrolling optimization
 * Mengikuti prinsip performance optimization untuk large lists
 */
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      item,
      index: visibleRange.startIndex + index
    }))
  }, [items, visibleRange])

  const totalHeight = items.length * itemHeight

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    visibleRange,
    handleScroll,
    offsetY: visibleRange.startIndex * itemHeight
  }
}