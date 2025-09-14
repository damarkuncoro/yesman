/**
 * Debug Logger Utility
 * Sistem logging untuk tracking alur proses dari UI hingga database
 * Hanya aktif di environment development
 */

export interface DebugContext {
  layer: 'UI' | 'SERVICE' | 'REPOSITORY' | 'DATABASE'
  module: string
  method: string
  userId?: string | number
  requestId?: string
  timestamp: string
}

export interface DebugLogEntry {
  context: DebugContext
  message: string
  data?: any
  duration?: number
  error?: Error
}

/**
 * Kelas untuk mengelola debug logging
 */
class DebugLogger {
  private isEnabled: boolean
  private logs: DebugLogEntry[] = []
  private maxLogs: number = 1000

  constructor() {
    // Hanya aktif di development environment
    this.isEnabled = process.env.NODE_ENV === 'development'
  }

  /**
   * Log debug message dengan context
   */
  log(context: Partial<DebugContext>, message: string, data?: any): void {
    if (!this.isEnabled) return

    const debugEntry: DebugLogEntry = {
      context: {
        layer: context.layer || 'SERVICE',
        module: context.module || 'Unknown',
        method: context.method || 'Unknown',
        userId: context.userId,
        requestId: context.requestId || this.generateRequestId(),
        timestamp: new Date().toISOString()
      },
      message,
      data: this.sanitizeData(data)
    }

    this.addLog(debugEntry)
    this.printLog(debugEntry)
  }

  /**
   * Log error dengan context
   */
  error(context: Partial<DebugContext>, message: string, error: Error, data?: any): void {
    if (!this.isEnabled) return

    const debugEntry: DebugLogEntry = {
      context: {
        layer: context.layer || 'SERVICE',
        module: context.module || 'Unknown',
        method: context.method || 'Unknown',
        userId: context.userId,
        requestId: context.requestId || this.generateRequestId(),
        timestamp: new Date().toISOString()
      },
      message,
      data: this.sanitizeData(data),
      error
    }

    this.addLog(debugEntry)
    this.printError(debugEntry)
  }

  /**
   * Log dengan tracking durasi eksekusi
   */
  time<T>(context: Partial<DebugContext>, message: string, fn: () => T | Promise<T>): T | Promise<T> {
    if (!this.isEnabled) {
      return fn()
    }

    const startTime = Date.now()
    const requestId = context.requestId || this.generateRequestId()
    
    this.log({ ...context, requestId }, `🚀 START: ${message}`)

    try {
      const result = fn()
      
      if (result instanceof Promise) {
        return result
          .then((res) => {
            const duration = Date.now() - startTime
            this.log({ ...context, requestId }, `✅ END: ${message}`, { duration: `${duration}ms` })
            return res
          })
          .catch((error) => {
            const duration = Date.now() - startTime
            this.error({ ...context, requestId }, `❌ ERROR: ${message}`, error, { duration: `${duration}ms` })
            throw error
          })
      } else {
        const duration = Date.now() - startTime
        this.log({ ...context, requestId }, `✅ END: ${message}`, { duration: `${duration}ms` })
        return result
      }
    } catch (error) {
      const duration = Date.now() - startTime
      this.error({ ...context, requestId }, `❌ ERROR: ${message}`, error as Error, { duration: `${duration}ms` })
      throw error
    }
  }

  /**
   * Mendapatkan semua logs untuk request tertentu
   */
  getLogsByRequestId(requestId: string): DebugLogEntry[] {
    if (!this.isEnabled) return []
    return this.logs.filter(log => log.context.requestId === requestId)
  }

  /**
   * Mendapatkan logs untuk user tertentu
   */
  getLogsByUserId(userId: string | number): DebugLogEntry[] {
    if (!this.isEnabled) return []
    return this.logs.filter(log => log.context.userId === userId)
  }

  /**
   * Clear semua logs
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * Export logs sebagai JSON
   */
  exportLogs(): string {
    if (!this.isEnabled) return '[]'
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Sanitize data untuk logging (hapus sensitive information)
   */
  private sanitizeData(data: any): any {
    if (!data) return data
    
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential']
    
    if (typeof data === 'object') {
      const sanitized = { ...data }
      
      for (const key in sanitized) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          sanitized[key] = '[REDACTED]'
        }
      }
      
      return sanitized
    }
    
    return data
  }

  /**
   * Tambah log ke array dengan limit
   */
  private addLog(entry: DebugLogEntry): void {
    this.logs.push(entry)
    
    // Hapus log lama jika melebihi limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  /**
   * Print log ke console dengan format yang rapi
   */
  private printLog(entry: DebugLogEntry): void {
    const { context, message, data } = entry
    const layerColor = this.getLayerColor(context.layer)
    
    console.log(
      `%c[${context.layer}]%c %c[${context.module}:${context.method}]%c ${message}`,
      `background: ${layerColor}; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;`,
      '',
      'color: #666; font-weight: bold;',
      'color: #333;'
    )
    
    if (data) {
      console.log('📊 Data:', data)
    }
    
    if (context.requestId) {
      console.log(`🔗 Request ID: ${context.requestId}`)
    }
    
    console.log('---')
  }

  /**
   * Print error ke console dengan format yang rapi
   */
  private printError(entry: DebugLogEntry): void {
    const { context, message, data, error } = entry
    
    console.error(
      `%c[${context.layer}]%c %c[${context.module}:${context.method}]%c ❌ ${message}`,
      'background: #dc3545; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
      '',
      'color: #666; font-weight: bold;',
      'color: #dc3545; font-weight: bold;'
    )
    
    if (error) {
      console.error('💥 Error:', error)
    }
    
    if (data) {
      console.error('📊 Data:', data)
    }
    
    if (context.requestId) {
      console.error(`🔗 Request ID: ${context.requestId}`)
    }
    
    console.log('---')
  }

  /**
   * Mendapatkan warna untuk setiap layer
   */
  private getLayerColor(layer: string): string {
    const colors = {
      UI: '#007bff',
      SERVICE: '#28a745',
      REPOSITORY: '#ffc107',
      DATABASE: '#dc3545'
    }
    return colors[layer as keyof typeof colors] || '#6c757d'
  }
}

// Singleton instance
const debugLogger = new DebugLogger()

/**
 * Helper functions untuk kemudahan penggunaan
 */

/**
 * Debug log untuk UI layer
 */
export const debugUI = (module: string, method: string, message: string, data?: any, userId?: string | number) => {
  debugLogger.log({ layer: 'UI', module, method, userId }, message, data)
}

/**
 * Debug log untuk Service layer
 */
export const debugService = (module: string, method: string, message: string, data?: any, userId?: string | number) => {
  debugLogger.log({ layer: 'SERVICE', module, method, userId }, message, data)
}

/**
 * Debug log untuk Repository layer
 */
export const debugRepository = (module: string, method: string, message: string, data?: any, userId?: string | number) => {
  debugLogger.log({ layer: 'REPOSITORY', module, method, userId }, message, data)
}

/**
 * Debug log untuk Database layer
 */
export const debugDatabase = (module: string, method: string, message: string, data?: any, userId?: string | number) => {
  debugLogger.log({ layer: 'DATABASE', module, method, userId }, message, data)
}

/**
 * Debug error untuk semua layer
 */
export const debugError = (layer: 'UI' | 'SERVICE' | 'REPOSITORY' | 'DATABASE', module: string, method: string, message: string, error: Error, data?: any, userId?: string | number) => {
  debugLogger.error({ layer, module, method, userId }, message, error, data)
}

/**
 * Debug dengan tracking waktu eksekusi
 */
export const debugTime = <T>(layer: 'UI' | 'SERVICE' | 'REPOSITORY' | 'DATABASE', module: string, method: string, message: string, fn: () => T | Promise<T>, userId?: string | number): T | Promise<T> => {
  return debugLogger.time({ layer, module, method, userId }, message, fn)
}

/**
 * Decorator untuk auto-debug method calls
 */
export function DebugMethod(layer: 'UI' | 'SERVICE' | 'REPOSITORY' | 'DATABASE', module: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = function (...args: any[]) {
      return debugTime(
        layer,
        module,
        propertyKey,
        `${propertyKey}(${args.map(arg => typeof arg).join(', ')})`,
        () => originalMethod.apply(this, args)
      )
    }
    
    return descriptor
  }
}

export default debugLogger