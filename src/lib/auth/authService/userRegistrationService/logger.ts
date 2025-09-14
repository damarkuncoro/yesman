/**
 * Logger untuk User Registration Service
 * Mengganti console.log dengan structured logging yang lebih baik
 */

import { LOG_CONFIG, LogLevel, LogCategory } from './constants';

/**
 * Interface untuk log entry
 */
interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  userId?: string;
  email?: string;
  action?: string;
}

/**
 * Logger class untuk User Registration Service
 */
export class UserRegistrationLogger {
  private static instance: UserRegistrationLogger;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): UserRegistrationLogger {
    if (!UserRegistrationLogger.instance) {
      UserRegistrationLogger.instance = new UserRegistrationLogger();
    }
    return UserRegistrationLogger.instance;
  }

  /**
   * Log error message
   */
  error(category: LogCategory, message: string, data?: any, context?: { userId?: string; email?: string; action?: string }): void {
    this.log(LOG_CONFIG.LEVELS.ERROR, category, message, data, context);
  }

  /**
   * Log warning message
   */
  warn(category: LogCategory, message: string, data?: any, context?: { userId?: string; email?: string; action?: string }): void {
    this.log(LOG_CONFIG.LEVELS.WARN, category, message, data, context);
  }

  /**
   * Log info message
   */
  info(category: LogCategory, message: string, data?: any, context?: { userId?: string; email?: string; action?: string }): void {
    this.log(LOG_CONFIG.LEVELS.INFO, category, message, data, context);
  }

  /**
   * Log debug message
   */
  debug(category: LogCategory, message: string, data?: any, context?: { userId?: string; email?: string; action?: string }): void {
    this.log(LOG_CONFIG.LEVELS.DEBUG, category, message, data, context);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel, 
    category: LogCategory, 
    message: string, 
    data?: any, 
    context?: { userId?: string; email?: string; action?: string }
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      userId: context?.userId,
      email: context?.email,
      action: context?.action
    };

    // Add to internal log storage
    this.logs.push(logEntry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Output to console with formatting
    this.outputToConsole(logEntry);
  }

  /**
   * Format and output log to console
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = this.getLevelPrefix(entry.level);
    const context = this.formatContext(entry);
    
    const logMessage = `${timestamp} ${prefix} [${entry.category}] ${entry.message}${context}`;
    
    switch (entry.level) {
      case LOG_CONFIG.LEVELS.ERROR:
        console.error(logMessage, entry.data || '');
        break;
      case LOG_CONFIG.LEVELS.WARN:
        console.warn(logMessage, entry.data || '');
        break;
      case LOG_CONFIG.LEVELS.INFO:
        console.info(logMessage, entry.data || '');
        break;
      case LOG_CONFIG.LEVELS.DEBUG:
        console.debug(logMessage, entry.data || '');
        break;
      default:
        console.log(logMessage, entry.data || '');
    }
  }

  /**
   * Get emoji prefix for log level
   */
  private getLevelPrefix(level: LogLevel): string {
    switch (level) {
      case LOG_CONFIG.LEVELS.ERROR:
        return '❌';
      case LOG_CONFIG.LEVELS.WARN:
        return '⚠️';
      case LOG_CONFIG.LEVELS.INFO:
        return '✅';
      case LOG_CONFIG.LEVELS.DEBUG:
        return '🔍';
      default:
        return 'ℹ️';
    }
  }

  /**
   * Format context information
   */
  private formatContext(entry: LogEntry): string {
    const contextParts: string[] = [];
    
    if (entry.userId) {
      contextParts.push(`userId=${entry.userId}`);
    }
    
    if (entry.email) {
      contextParts.push(`email=${entry.email}`);
    }
    
    if (entry.action) {
      contextParts.push(`action=${entry.action}`);
    }
    
    return contextParts.length > 0 ? ` (${contextParts.join(', ')})` : '';
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: LogCategory, limit: number = 100): LogEntry[] {
    return this.logs
      .filter(log => log.category === category)
      .slice(-limit);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel, limit: number = 100): LogEntry[] {
    return this.logs
      .filter(log => log.level === level)
      .slice(-limit);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
const logger = UserRegistrationLogger.getInstance();

// Convenience functions for common logging patterns
export const logUserRegistration = {
  success: (email: string, userId?: string) => {
    logger.info(
      LOG_CONFIG.CATEGORIES.REGISTRATION,
      'User registered successfully',
      undefined,
      { email, userId, action: 'register' }
    );
  },
  
  failed: (email: string, error: string, userId?: string) => {
    logger.error(
      LOG_CONFIG.CATEGORIES.REGISTRATION,
      'User registration failed',
      { error },
      { email, userId, action: 'register' }
    );
  },
  
  validation: (email: string, field: string, error: string) => {
    logger.warn(
      LOG_CONFIG.CATEGORIES.VALIDATION,
      `Validation failed for ${field}`,
      { error },
      { email, action: 'validate' }
    );
  },
  
  permission: (adminEmail: string, targetEmail: string, action: string, allowed: boolean) => {
    logger.info(
      LOG_CONFIG.CATEGORIES.PERMISSION,
      `Permission check: ${action} ${allowed ? 'allowed' : 'denied'}`,
      undefined,
      { email: adminEmail, action: `permission-${action}` }
    );
  }
};

export const logBulkOperation = {
  start: (count: number, adminEmail?: string) => {
    logger.info(
      LOG_CONFIG.CATEGORIES.BULK_OPERATION,
      `Starting bulk registration for ${count} users`,
      { count },
      { email: adminEmail, action: 'bulk-start' }
    );
  },
  
  progress: (processed: number, total: number, adminEmail?: string) => {
    logger.info(
      LOG_CONFIG.CATEGORIES.BULK_OPERATION,
      `Bulk registration progress: ${processed}/${total}`,
      { processed, total },
      { email: adminEmail, action: 'bulk-progress' }
    );
  },
  
  complete: (successful: number, failed: number, adminEmail?: string) => {
    logger.info(
      LOG_CONFIG.CATEGORIES.BULK_OPERATION,
      `Bulk registration completed: ${successful} successful, ${failed} failed`,
      { successful, failed },
      { email: adminEmail, action: 'bulk-complete' }
    );
  }
};

export const logStatistics = {
  generate: (type: string, adminEmail?: string) => {
    logger.info(
      LOG_CONFIG.CATEGORIES.STATISTICS,
      `Generating ${type} statistics`,
      { type },
      { email: adminEmail, action: 'stats-generate' }
    );
  },
  
  export: (format: string, recordCount: number, adminEmail?: string) => {
    logger.info(
      LOG_CONFIG.CATEGORIES.STATISTICS,
      `Exporting statistics to ${format}`,
      { format, recordCount },
      { email: adminEmail, action: 'stats-export' }
    );
  }
};

// Export the logger instance
export default logger;