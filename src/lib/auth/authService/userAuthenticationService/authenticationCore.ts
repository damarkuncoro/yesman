import { AuthenticationError } from "../../../errors/errorHandler";
import { PasswordService } from "../passwordService";
import { TokenService } from "../tokenService/index";
import { SessionService } from "../sessionService";
import { 
  LoginCredentials, 
  LoginResponse, 
  RefreshTokenRequest, 
  RefreshTokenResponse,
  SessionVerificationResponse,
  UserRepository,
  AUTH_CONFIG
} from "./types";
import { UserAuthenticationValidator } from "./validation";
import { UserAuthenticationRateLimiter } from "./rateLimiting";

/**
 * Core authentication logic class
 * Menangani proses login, logout, refresh token, dan session verification
 */
export class UserAuthenticationCore {
  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService,
    private tokenService: TokenService,
    private sessionService: SessionService,
    private validator: UserAuthenticationValidator,
    private rateLimiter: UserAuthenticationRateLimiter
  ) {}

  /**
   * Login user dengan email dan password
   * @param credentials - Login credentials
   * @returns Login response dengan tokens dan session
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Validasi input
      this.validator.validateLoginCredentials(credentials);

      // Check rate limiting
      this.rateLimiter.checkRateLimit(credentials.email);

      // Find user by email
      const user = await this.userRepository.findByEmail(credentials.email.toLowerCase().trim());
      
      if (!user) {
        this.rateLimiter.recordFailedAttempt(credentials.email);
        throw new AuthenticationError('Email atau password tidak valid');
      }

      // Check apakah user aktif
      if (!user.active) {
        throw new AuthenticationError('Akun tidak aktif');
      }

      // Verify password
      const isPasswordValid = await this.passwordService.verifyPassword(
        credentials.password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        this.rateLimiter.recordFailedAttempt(credentials.email);
        throw new AuthenticationError('Email atau password tidak valid');
      }

      // Reset failed attempts on successful login
      this.rateLimiter.resetFailedAttempts(credentials.email);

      // Generate tokens
      const tokens = this.tokenService.generateTokens({
        userId: parseInt(user.id),
        email: user.email
      });
      
      const { accessToken, refreshToken } = tokens;

      // Create session
      const sessionDuration = credentials.rememberMe 
        ? AUTH_CONFIG.REMEMBER_ME_DURATION 
        : AUTH_CONFIG.DEFAULT_SESSION_DURATION;
        
      const sessionResult = await this.sessionService.createSession({
        userId: user.id.toString(),
        expiresIn: sessionDuration
        // Note: ipAddress dan userAgent tidak ada di SessionCreateData interface
        // TODO: Add ipAddress and userAgent fields to sessions table if needed
      });
      
      if (!sessionResult.success || !sessionResult.data) {
        throw new AuthenticationError('Failed to create session');
      }
      
      const session = sessionResult.data;

      // Update last login info
      await this.userRepository.updateLastLogin(user.id, {
        lastLoginAt: new Date(),
        lastLoginIp: credentials.ipAddress
      });

      console.log(`✅ User logged in successfully: ${user.email}`);

      // Return response
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          department: user.department,
          region: user.region,
          level: user.level,
          role: user.role ? {
            id: user.role.id,
            name: user.role.name,
            permissions: user.role.permissions?.map((p: any) => p.name) || []
          } : undefined
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: sessionDuration
        },
        session: {
          id: session.id.toString(),
          expiresAt: session.expiresAt
        }
      };
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout user (deactivate session)
   * @param sessionId - ID session yang akan di-logout
   */
  async logout(sessionId: string): Promise<void> {
    try {
      this.validator.validateSessionId(sessionId);
      await this.sessionService.deactivateSession(sessionId);
      console.log(`✅ User logged out successfully: session ${sessionId}`);
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  }

  /**
   * Logout dari semua device (deactivate all sessions)
   * @param userId - ID user
   */
  async logoutFromAllDevices(userId: string): Promise<void> {
    try {
      this.validator.validateUserId(userId);
      await this.sessionService.deactivateAllUserSessions(userId);
      console.log(`✅ User logged out from all devices: ${userId}`);
    } catch (error) {
      console.error('❌ Logout from all devices failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token menggunakan refresh token
   * @param request - Refresh token request
   * @returns New access token dan updated session
   */
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      this.validator.validateRefreshToken(request.refreshToken);

      // Verify refresh token
      const payload = await this.tokenService.verifyRefreshToken(request.refreshToken);
      
      if (!payload.userId) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Get user data
      const user = await this.userRepository.findById(payload.userId.toString());
      
      if (!user || !user.active) {
        throw new AuthenticationError('User tidak valid atau tidak aktif');
      }

      // Generate new access token
      const tokens = this.tokenService.generateTokens({
        userId: parseInt(user.id),
        email: user.email
      });
      
      const { accessToken } = tokens;

      // Find and refresh session (jika ada)
      const sessions = await this.sessionService.getUserSessions(user.id);
      let session: any = null;
      
      if (sessions.length > 0) {
        // Refresh session yang paling baru
        session = sessions.sort((a: any, b: any) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime())[0];
        session = await this.sessionService.refreshSession(session.id);
      }

      console.log(`✅ Token refreshed successfully for user: ${user.email}`);

      return {
        accessToken,
        expiresIn: AUTH_CONFIG.DEFAULT_SESSION_DURATION,
        session: session ? {
          id: session.id,
          expiresAt: session.expiresAt
        } : {
          id: '',
          expiresAt: new Date()
        }
      };
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Verify current session
   * @param sessionToken - Session token
   * @returns Session data jika valid
   */
  async verifySession(sessionToken: string): Promise<SessionVerificationResponse> {
    try {
      this.validator.validateSessionToken(sessionToken);

      // Validate session
      const validationResult = await this.sessionService.validateSession(sessionToken);
      
      if (!validationResult.isValid || !validationResult.session) {
        throw new AuthenticationError('Session tidak valid');
      }
      
      const session = validationResult.session;
      
      // Get user data
      const user = await this.userRepository.findById(session.userId.toString());
      
      if (!user || !user.active) {
        throw new AuthenticationError('User tidak valid atau tidak aktif');
      }

      return { session, user };
    } catch (error) {
      console.error('❌ Session verification failed:', error);
      throw error;
    }
  }

  /**
   * Check apakah login dari lokasi yang mencurigakan
   * @param userId - ID user
   * @param currentIpAddress - IP address saat ini
   * @returns true jika login mencurigakan
   */
  async isSuspiciousLogin(userId: string, currentIpAddress?: string): Promise<boolean> {
    try {
      if (!currentIpAddress) return false;
      
      this.validator.validateUserId(userId);
      
      const user = await this.userRepository.findById(userId);
      
      // Check jika IP berbeda dari last login IP
      if (user?.lastLoginIp && user.lastLoginIp !== currentIpAddress) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to check suspicious login:', error);
      return false;
    }
  }
}

/**
 * Factory function untuk membuat UserAuthenticationCore
 * @param userRepository - User repository dependency
 * @param passwordService - Password service dependency
 * @param tokenService - Token service dependency
 * @param sessionService - Session service dependency
 * @param validator - Validator dependency (optional)
 * @param rateLimiter - Rate limiter dependency (optional)
 * @returns Instance dari UserAuthenticationCore
 */
export function createUserAuthenticationCore(
  userRepository: UserRepository,
  passwordService: PasswordService,
  tokenService: TokenService,
  sessionService: SessionService,
  validator?: UserAuthenticationValidator,
  rateLimiter?: UserAuthenticationRateLimiter
): UserAuthenticationCore {
  const authValidator = validator || new UserAuthenticationValidator();
  const authRateLimiter = rateLimiter || new UserAuthenticationRateLimiter();
  
  return new UserAuthenticationCore(
    userRepository,
    passwordService,
    tokenService,
    sessionService,
    authValidator,
    authRateLimiter
  );
}