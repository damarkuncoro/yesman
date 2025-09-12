/**
 * Access Log Repository Module
 * 
 * Module ini mengexport AccessLogRepository class dan instance-nya
 * untuk operasi CRUD pada entitas AccessLog.
 * 
 * @module AccessLogRepository
 */

// Import dan re-export AccessLogRepository
import { AccessLogRepository as AccessLogRepositoryClass, accessLogRepository as accessLogRepositoryInstance } from './accessLogRepository';

export { AccessLogRepositoryClass as AccessLogRepository, accessLogRepositoryInstance as accessLogRepository };
export type { AccessLog, NewAccessLog } from '@/db/schema';