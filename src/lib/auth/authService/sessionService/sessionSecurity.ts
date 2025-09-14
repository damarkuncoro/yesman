import {
  Session,
  SessionRepository,
  SessionConfig,
  DEFAULT_SESSION_CONFIG,
  SessionSecurityEvent,
  SessionSecurityResult,
  SessionEventType
} from "./types";
import { SessionValidator } from "./validation";

/**
 * Kelas untuk menangani security dan monitoring session
 * Bertanggung jawab untuk deteksi anomali, rate limiting, dan security logging
 */
export class SessionSecurityService {
  private config: SessionConfig;
  private validator: SessionValidator;
  private securityEvents: SessionSecurityEvent[] = [];
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(
    private sessionRepository: SessionRepository,
    config: Partial<SessionConfig> = {},
    validator?: SessionValidator
  ) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.validator = validator || new SessionValidator(this.config);
  }

  /**
   * Validasi security session dengan berbagai checks
   * @param session - Session yang akan divalidasi
   * @param currentIp - IP address saat ini
   * @param currentUserAgent - User agent saat ini
   * @returns Hasil validasi security
   */
  async validateSessionSecurity(
    session: Session,
    currentIp?: string,
    currentUserAgent?: string
  ): Promise<SessionSecurityResult> {
    const securityChecks = {
      isValid: true,
      warnings: [] as string[],
      threats: [] as string[],
      shouldTerminate: false,
      riskScore: 0
    };

    try {
      // Basic session validation
      const basicValidation = this.validator.validateSession(session);
      if (!basicValidation.isValid) {
        securityChecks.isValid = false;
        securityChecks.threats.push('Invalid session structure');
        securityChecks.riskScore += 100;
        return securityChecks;
      }

      // Check session expiry
      const now = new Date();
      if (session.expiresAt <= now) {
        securityChecks.isValid = false;
        securityChecks.threats.push('Session expired');
        securityChecks.riskScore += 100;
        return securityChecks;
      }

      // Note: IP address and User agent validation disabled
      // Session schema only has: id, userId, refreshToken, expiresAt, createdAt
      // TODO: Add ipAddress and userAgent fields to sessions table if needed

      // Check for suspicious activity patterns
      const suspiciousActivity = await this.detectSuspiciousActivity(session);
      if (suspiciousActivity.detected) {
        securityChecks.warnings.push(...suspiciousActivity.warnings);
        securityChecks.threats.push(...suspiciousActivity.threats);
        securityChecks.riskScore += suspiciousActivity.riskScore;
      }

      // Check rate limiting
      const rateLimitCheck = this.checkRateLimit(session.userId.toString(), currentIp);
      if (!rateLimitCheck.allowed) {
        securityChecks.threats.push('Rate limit exceeded');
        securityChecks.riskScore += 50;
        securityChecks.shouldTerminate = true;
      }

      // Determine if session should be terminated based on risk score
      if (securityChecks.riskScore >= 80) {
        securityChecks.shouldTerminate = true;
        securityChecks.threats.push('High risk score detected');
      }

      return securityChecks;
    } catch (error) {
      console.error('❌ Session security validation failed:', error);
      return {
        isValid: false,
        warnings: [],
        threats: ['Security validation error'],
        shouldTerminate: true,
        riskScore: 100
      };
    }
  }

  /**
   * Deteksi aktivitas mencurigakan pada session
   * @param session - Session yang akan diperiksa
   * @returns Hasil deteksi
   */
  private async detectSuspiciousActivity(session: Session): Promise<{
    detected: boolean;
    warnings: string[];
    threats: string[];
    riskScore: number;
  }> {
    const result = {
      detected: false,
      warnings: [] as string[],
      threats: [] as string[],
      riskScore: 0
    };

    try {
      // Check for multiple concurrent sessions
      const userSessions = await this.sessionRepository.findByUserId(session.userId);
      const activeSessions = userSessions.filter(s => 
        s.expiresAt > new Date()
      );

      if (activeSessions.length > this.config.maxSessionsPerUser) {
        result.detected = true;
        result.warnings.push('Multiple concurrent sessions detected');
        result.riskScore += 25;
      }

      // Check for rapid session creation
      const recentSessions = userSessions.filter(s => 
        s.createdAt > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
      );

      if (recentSessions.length > 3) {
        result.detected = true;
        result.threats.push('Rapid session creation detected');
        result.riskScore += 40;
        
        await this.logSecurityEvent({
          type: SessionEventType.RAPID_SESSION_CREATION,
          sessionId: session.id.toString(),
          userId: session.userId.toString(),
          details: {
            sessionCount: recentSessions.length,
            timeWindow: '5 minutes',
            timestamp: new Date()
          },
          riskLevel: 'high'
        });
      }

      // Check for unusual access patterns
      const accessPattern = this.analyzeAccessPattern(session);
      if (accessPattern.unusual) {
        result.detected = true;
        result.warnings.push('Unusual access pattern detected');
        result.riskScore += accessPattern.riskScore;
      }

      return result;
    } catch (error) {
      console.error('❌ Suspicious activity detection failed:', error);
      return result;
    }
  }

  /**
   * Analisis pola akses session
   * @param session - Session yang akan dianalisis
   * @returns Hasil analisis
   */
  private analyzeAccessPattern(session: Session): {
    unusual: boolean;
    riskScore: number;
    patterns: string[];
  } {
    const result = {
      unusual: false,
      riskScore: 0,
      patterns: [] as string[]
    };

    try {
      // Check session duration
      const sessionDuration = Date.now() - session.createdAt.getTime();
      const maxDuration = this.config.sessionDuration || (24 * 60 * 60 * 1000); // 24 hours

      if (sessionDuration > maxDuration * 2) {
        result.unusual = true;
        result.riskScore += 15;
        result.patterns.push('Unusually long session duration');
      }

      // Note: Last access time check disabled
      // Session schema doesn't have lastAccessedAt field
      // TODO: Add lastAccessedAt field to sessions table if needed

      return result;
    } catch (error) {
      console.error('❌ Access pattern analysis failed:', error);
      return result;
    }
  }

  /**
   * Check rate limiting untuk user/IP
   * @param userId - ID user
   * @param ipAddress - IP address (opsional)
   * @returns Hasil rate limit check
   */
  private checkRateLimit(userId: string, ipAddress?: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100; // Max requests per window
    
    const key = ipAddress ? `${userId}:${ipAddress}` : userId;
    const current = this.rateLimitMap.get(key);

    if (!current || now > current.resetTime) {
      // Reset or initialize
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs
      };
    }

    if (current.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime
      };
    }

    // Increment count
    current.count++;
    this.rateLimitMap.set(key, current);

    return {
      allowed: true,
      remaining: maxRequests - current.count,
      resetTime: current.resetTime
    };
  }

  /**
   * Log security event
   * @param event - Security event yang akan di-log
   */
  async logSecurityEvent(event: SessionSecurityEvent): Promise<void> {
    try {
      // Add timestamp if not provided
      if (!event.details.timestamp) {
        event.details.timestamp = new Date();
      }

      // Store in memory (in production, this should go to a persistent store)
      this.securityEvents.push(event);

      // Keep only last 1000 events to prevent memory issues
      if (this.securityEvents.length > 1000) {
        this.securityEvents = this.securityEvents.slice(-1000);
      }

      // Log to console based on risk level
      const logMessage = `🔒 Security Event [${event.type}] - User: ${event.userId}, Session: ${event.sessionId}, Risk: ${event.riskLevel}`;
      
      switch (event.riskLevel) {
        case 'high':
          console.error(logMessage, event.details);
          break;
        case 'medium':
          console.warn(logMessage, event.details);
          break;
        case 'low':
        default:
          console.log(logMessage, event.details);
          break;
      }

      // In production, you might want to:
      // - Send to external security monitoring service
      // - Store in database
      // - Send alerts for high-risk events
      // - Trigger automated responses
      
    } catch (error) {
      console.error('❌ Failed to log security event:', error);
    }
  }

  /**
   * Get security events untuk user atau session
   * @param filters - Filter untuk events
   * @returns Array of security events
   */
  getSecurityEvents(filters: {
    userId?: string;
    sessionId?: string;
    type?: SessionEventType;
    riskLevel?: 'low' | 'medium' | 'high';
    since?: Date;
    limit?: number;
  } = {}): SessionSecurityEvent[] {
    let events = [...this.securityEvents];

    // Apply filters
    if (filters.userId) {
      events = events.filter(e => e.userId === filters.userId);
    }
    
    if (filters.sessionId) {
      events = events.filter(e => e.sessionId === filters.sessionId);
    }
    
    if (filters.type) {
      events = events.filter(e => e.type === filters.type);
    }
    
    if (filters.riskLevel) {
      events = events.filter(e => e.riskLevel === filters.riskLevel);
    }
    
    if (filters.since) {
      events = events.filter(e => 
        e.details.timestamp && e.details.timestamp >= filters.since!
      );
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => {
      const timeA = a.details.timestamp?.getTime() || 0;
      const timeB = b.details.timestamp?.getTime() || 0;
      return timeB - timeA;
    });

    // Apply limit
    if (filters.limit) {
      events = events.slice(0, filters.limit);
    }

    return events;
  }

  /**
   * Get security statistics
   * @param timeWindow - Time window dalam milidetik (default: 24 jam)
   * @returns Security statistics
   */
  getSecurityStatistics(timeWindow: number = 24 * 60 * 60 * 1000): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByRiskLevel: Record<string, number>;
    topUsers: Array<{ userId: string; eventCount: number }>;
    recentThreats: number;
  } {
    const since = new Date(Date.now() - timeWindow);
    const recentEvents = this.getSecurityEvents({ since });

    // Count by type
    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count by risk level
    const eventsByRiskLevel = recentEvents.reduce((acc, event) => {
      acc[event.riskLevel] = (acc[event.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top users by event count
    const userEventCounts = recentEvents.reduce((acc, event) => {
      acc[event.userId] = (acc[event.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topUsers = Object.entries(userEventCounts)
      .map(([userId, eventCount]) => ({ userId, eventCount: eventCount as number }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Recent threats (high risk events)
    const recentThreats = recentEvents.filter(e => e.riskLevel === 'high').length;

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsByRiskLevel,
      topUsers,
      recentThreats
    };
  }

  /**
   * Clear old security events
   * @param olderThan - Clear events older than this date
   * @returns Number of events cleared
   */
  clearOldSecurityEvents(olderThan: Date): number {
    const initialCount = this.securityEvents.length;
    
    this.securityEvents = this.securityEvents.filter(event => 
      !event.details.timestamp || event.details.timestamp >= olderThan
    );
    
    const clearedCount = initialCount - this.securityEvents.length;
    
    if (clearedCount > 0) {
      console.log(`✅ Cleared ${clearedCount} old security events`);
    }
    
    return clearedCount;
  }

  /**
   * Reset rate limit untuk user/IP
   * @param userId - ID user
   * @param ipAddress - IP address (opsional)
   */
  resetRateLimit(userId: string, ipAddress?: string): void {
    const key = ipAddress ? `${userId}:${ipAddress}` : userId;
    this.rateLimitMap.delete(key);
    console.log(`✅ Rate limit reset for ${key}`);
  }

  /**
   * Get current rate limit status
   * @param userId - ID user
   * @param ipAddress - IP address (opsional)
   * @returns Rate limit status
   */
  getRateLimitStatus(userId: string, ipAddress?: string): {
    count: number;
    resetTime: number;
    remaining: number;
  } | null {
    const key = ipAddress ? `${userId}:${ipAddress}` : userId;
    const current = this.rateLimitMap.get(key);
    
    if (!current) {
      return null;
    }
    
    const maxRequests = 100;
    
    return {
      count: current.count,
      resetTime: current.resetTime,
      remaining: Math.max(0, maxRequests - current.count)
    };
  }

  /**
   * Update security configuration
   * @param newConfig - Konfigurasi baru
   */
  updateConfig(newConfig: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.validator = new SessionValidator(this.config);
  }

  /**
   * Get current security configuration
   * @returns Current security config
   */
  getConfig(): SessionConfig {
    return { ...this.config };
  }
}

/**
 * Factory function untuk membuat SessionSecurityService
 * @param sessionRepository - Repository session
 * @param config - Konfigurasi session (opsional)
 * @param validator - Validator session (opsional)
 * @returns Instance SessionSecurityService
 */
export function createSessionSecurityService(
  sessionRepository: SessionRepository,
  config?: Partial<SessionConfig>,
  validator?: SessionValidator
): SessionSecurityService {
  return new SessionSecurityService(sessionRepository, config, validator);
}