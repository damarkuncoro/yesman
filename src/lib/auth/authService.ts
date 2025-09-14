import { ValidationService } from "../validation/validator";
import { ErrorHandler, ValidationError, AuthenticationError, NotFoundError, ConflictError } from "../errors/errorHandler";
import { userCreateSchema, userLoginSchema } from "../validation/schemas";
import { userRepository, sessionRepository, userRoleRepository, roleRepository, roleFeatureRepository, featureRepository } from "@/repositories";
import type { User } from "@/db/schema";
import type { 
  JWTPayload, 
  AuthResponse, 
  IAuthService, 
  AuthenticatedUserContext,
  ErrorResponse 
} from "./types";

// Import service-service kecil
import { TokenService } from './authService/tokenService/index';
import { PasswordService } from './authService/passwordService';
import { PermissionService } from './authService/permissionService';
import { SessionService } from './authService/sessionService';
import { UserRegistrationService } from './authService/userRegistrationService/index';
import { UserAuthenticationService } from './authService/userAuthenticationService';
import type { Session } from './authService/sessionService';

// Service instances will be created in AuthService class

/**
 * Unified Authentication Service
 * Mengikuti Single Responsibility Principle dan Open/Closed Principle
 * Menggabungkan semua authentication logic dari berbagai tempat
 * Menerapkan Dependency Inversion Principle dengan interface
 */
export class AuthService implements IAuthService {
  // Create instances of services with proper initialization
  private tokenService: TokenService;
  private passwordService: PasswordService;
  private permissionService: PermissionService;
  private sessionService: SessionService;
  private userRegistrationService: UserRegistrationService;
  private userAuthenticationService: UserAuthenticationService;

  constructor() {
    // Initialize services with proper dependencies
    // Create adapter for UserRepository to match TokenService interface
    const tokenServiceUserAdapter = {
      findByEmail: async (email: string) => {
        const user = await userRepository.findByEmail(email);
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          active: user.active ?? true
        };
      },
      findById: async (id: number) => {
        const user = await userRepository.findById(id);
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          active: user.active ?? true
        };
      },
      updateLastLogin: async (id: number, loginData: { lastLoginAt: Date; lastLoginIp?: string }) => {
        await userRepository.updateLastLogin(id);
      }
    };
    
    this.tokenService = new TokenService(tokenServiceUserAdapter);
    this.passwordService = new PasswordService();
    this.permissionService = new PermissionService();
    
    // Create a proper SessionService implementation using sessionRepository
    const simpleSessionRepository = {
      create: async (data: Omit<Session, 'id' | 'createdAt'>) => {
        // Convert database session to Session interface format
        const dbSession = await sessionRepository.create({
          userId: data.userId,
          refreshToken: data.refreshToken || '',
          expiresAt: data.expiresAt
        });
        
        // Transform database session to Session interface
        return {
          id: dbSession.id,
          userId: dbSession.userId,
          refreshToken: dbSession.refreshToken,
          expiresAt: dbSession.expiresAt,
          createdAt: dbSession.createdAt
        };
      },
      findById: async (id: number) => {
        const dbSession = await sessionRepository.findById(id);
        if (!dbSession) return null;
        
        // Transform database session to Session interface
        return {
          id: dbSession.id,
          userId: dbSession.userId,
          refreshToken: dbSession.refreshToken,
          expiresAt: dbSession.expiresAt,
          createdAt: dbSession.createdAt
        };
      },
      findByToken: async (token: string) => {
        // Implementasi sederhana - dalam production harus menggunakan token mapping
        return null;
      },
      findByRefreshToken: async (refreshToken: string) => {
        const dbSession = await sessionRepository.findByRefreshToken(refreshToken);
        if (!dbSession) return null;
        
        return {
          id: dbSession.id,
          userId: dbSession.userId,
          refreshToken: dbSession.refreshToken,
          expiresAt: dbSession.expiresAt,
          createdAt: dbSession.createdAt
        };
      },
      findByUserId: async (userId: number) => {
        const dbSessions = await sessionRepository.findByUserId(userId);
        return dbSessions.map(dbSession => ({
          id: dbSession.id,
          userId: dbSession.userId,
          refreshToken: dbSession.refreshToken,
          expiresAt: dbSession.expiresAt,
          createdAt: dbSession.createdAt
        }));
      },
      update: async (id: number, data: Partial<Session>) => {
        const dbSession = await sessionRepository.update(id, {
          userId: data.userId,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt
        });
        
        if (!dbSession) {
          throw new Error(`Session with id ${id} not found for update`);
        }
        
        return {
          id: dbSession.id,
          userId: dbSession.userId,
          refreshToken: dbSession.refreshToken,
          expiresAt: dbSession.expiresAt,
          createdAt: dbSession.createdAt
        };
      },
      delete: async (id: number) => {
        await sessionRepository.delete(id);
      },
      deleteByUserId: async (userId: number) => {
        await sessionRepository.deleteByUserId(userId);
      },
      deleteExpired: async () => {
        return await sessionRepository.deleteExpiredSessions();
      }
    };
    
    this.sessionService = new SessionService(simpleSessionRepository);
    
    // Create adapter for UserRepository to match UserAuthenticationService interface
    const userRepositoryAdapter = {
      findByEmail: async (email: string) => {
        return await userRepository.findByEmail(email);
      },
      findById: async (id: string) => {
        return await userRepository.findById(parseInt(id));
      },
      updateLastLogin: async (id: string, loginData: { lastLoginAt: Date; lastLoginIp?: string }) => {
        await userRepository.updateLastLogin(parseInt(id));
      }
    };
    
    // Initialize UserAuthenticationService with all required dependencies
    this.userAuthenticationService = new UserAuthenticationService(
      userRepositoryAdapter,
      this.passwordService,
      this.tokenService,
      this.sessionService,
      this.permissionService
    );
    
    // Create simple service instances for now - will be refactored later
    this.userRegistrationService = {
      registerUser: async () => { throw new Error('Not implemented'); },
      bulkRegisterUsers: async () => { throw new Error('Not implemented'); }
    } as any;
  }

  /**
   * Verifikasi JWT token dan return payload
   * @param token - JWT token yang akan diverifikasi
   * @returns JWTPayload jika valid, null jika tidak valid
   */
  async verifyToken(token: string): Promise<JWTPayload | null> {
    return await this.tokenService.verifyAccessToken(token);
  }

  /**
   * Verifikasi refresh token
   * @param token - Refresh token yang akan diverifikasi
   * @returns JWTPayload jika valid
   * @throws AuthenticationError jika tidak valid
   */
  async verifyRefreshToken(token: string): Promise<JWTPayload> {
    return await this.tokenService.verifyRefreshToken(token);
  }

  /**
   * Mendapatkan ringkasan permission user
   * @param userId - ID user
   * @returns Object berisi roles dan permissions
   */
  async getUserPermissionSummary(userId: number): Promise<any> {
    // Get user data first
    const user = await userRepository.findById(userId);
    if (!user) {
      return null;
    }
    
    // Get user role with permissions
    const userRoles = await userRoleRepository.findByUserId(userId);
    if (userRoles.length === 0) {
      return null;
    }
    
    const role = await roleRepository.findById(userRoles[0].roleId);
    if (!role) {
      return null;
    }
    
    // Get role permissions
    const roleFeatures = await roleFeatureRepository.findByRoleId(role.id);
    const permissions = await Promise.all(
      roleFeatures.map(rf => featureRepository.findById(rf.featureId))
    );
    
    const userWithRole = {
       ...user,
       id: user.id.toString(),
       role: {
         ...role,
         id: role.id.toString(),
         permissions: permissions.filter(Boolean).map(p => ({
            id: p!.id.toString(),
            name: p!.name,
            description: p!.description ?? undefined
          }))
       }
     };
     
     return this.permissionService.getUserPermissionSummary(userWithRole);
  }

  /**
   * Memeriksa apakah user memiliki permission untuk feature dan action tertentu
   * @param userId - ID user
   * @param feature - Nama feature
   * @param action - Action yang akan dilakukan (create, read, update, delete)
   * @returns true jika memiliki permission, false jika tidak
   */
  async checkPermission(userId: number, feature: string, action: string): Promise<boolean> {
    // Get user data first
    const user = await userRepository.findById(userId);
    if (!user) {
      return false;
    }
    
    // Get user roles with permissions
    const userRoles = await userRoleRepository.findByUserId(userId);
    if (userRoles.length === 0) {
      return false;
    }
    
    // Check if any role has grants_all = true
    for (const userRole of userRoles) {
      const role = await roleRepository.findById(userRole.roleId);
      if (role && role.grantsAll) {
        console.log(`User ${userId} has grants_all access via role ${role.name}`);
        return true; // Bypass all permission checks
      }
    }
    
    // If no grants_all role, check specific permissions
    const role = await roleRepository.findById(userRoles[0].roleId);
    if (!role) {
      return false;
    }
    
    // Get role permissions
    const roleFeatures = await roleFeatureRepository.findByRoleId(role.id);
    const permissions = await Promise.all(
      roleFeatures.map(rf => featureRepository.findById(rf.featureId))
    );
    
    const userWithRole = {
       ...user,
       id: user.id.toString(),
       role: {
         ...role,
         id: role.id.toString(),
         permissions: permissions.filter(Boolean).map(p => ({
            id: p!.id.toString(),
            name: p!.name,
            description: p!.description ?? undefined
          }))
       }
     };
     
     return this.permissionService.hasPermission(userWithRole, `${feature}:${action}`);
  }

  /**
   * Memeriksa apakah user memiliki role tertentu
   * @param userId - ID user
   * @param role - Nama role
   * @returns true jika memiliki role, false jika tidak
   */
  async hasRole(userId: number, role: string): Promise<boolean> {
    // Get user data first
    const user = await userRepository.findById(userId);
    if (!user) {
      return false;
    }
    
    // Get user role
    const userRoles = await userRoleRepository.findByUserId(userId);
    if (userRoles.length === 0) {
      return false;
    }
    
    const userRole = await roleRepository.findById(userRoles[0].roleId);
    if (!userRole) {
      return false;
    }
    
    const userWithRole = {
       ...user,
       id: user.id.toString(),
       role: {
         ...userRole,
         id: userRole.id.toString()
       }
     };
     
     return this.permissionService.hasRole(userWithRole, role);
  }

  /**
   * Memeriksa apakah user memiliki salah satu dari roles yang diberikan
   * @param userId - ID user
   * @param roles - Array nama roles
   * @returns true jika memiliki salah satu role, false jika tidak
   */
  async hasAnyRole(userId: number, roles: string[]): Promise<boolean> {
    // Check if user has any of the specified roles
    for (const role of roles) {
      if (await this.hasRole(userId, role)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Register user baru dengan authentication
   * Business rules:
   * - Validasi input menggunakan ValidationService
   * - Email harus unik
   * - Password di-hash menggunakan bcrypt
   * - Auto-assign role berdasarkan urutan user
   * @param userData - Data user baru
   * @returns Promise<AuthResponse> - Response dengan token
   */
  async register(userData: unknown): Promise<AuthResponse> {
    // Implementation will be added later
    throw new Error('register method not implemented yet');
  }

  /**
   * Login user
   * Business rules:
   * - Validasi input
   * - Verifikasi password
   * - User harus aktif
   * @param loginData - Data login
   * @returns Promise<AuthResponse> - Response dengan token
   */
  async login(loginData: unknown): Promise<AuthResponse> {
    try {
      // Validasi dan parse input data
      const credentials = this.validateLoginData(loginData);
      
      // Gunakan UserAuthenticationService untuk proses login
      const loginResponse = await this.userAuthenticationService.login(credentials);
      
      // Konversi response ke format AuthResponse
       const authResponse: AuthResponse = {
         user: {
           id: parseInt(loginResponse.user.id),
           name: loginResponse.user.name,
           email: loginResponse.user.email,
           active: true,
           department: loginResponse.user.department,
           region: loginResponse.user.region,
           level: loginResponse.user.level,
           rolesUpdatedAt: null,
           createdAt: new Date(),
           updatedAt: new Date()
         },
         accessToken: loginResponse.tokens.accessToken,
         refreshToken: loginResponse.tokens.refreshToken
       };
      
      return authResponse;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Validasi data login
   * @param loginData - Data login yang akan divalidasi
   * @returns Validated login credentials
   */
  private validateLoginData(loginData: unknown) {
    if (!loginData || typeof loginData !== 'object') {
      throw new ValidationError('Data login tidak valid');
    }

    const data = loginData as Record<string, any>;

    if (!data.email || typeof data.email !== 'string') {
      throw new ValidationError('Email diperlukan dan harus berupa string');
    }

    if (!data.password || typeof data.password !== 'string') {
      throw new ValidationError('Password diperlukan dan harus berupa string');
    }

    return {
      email: data.email.toLowerCase().trim(),
      password: data.password,
      rememberMe: data.rememberMe || false,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    };
  }

  /**
   * Logout user dengan menghapus refresh token
   * @param refreshToken - Refresh token yang akan dihapus
   */
  async logout(refreshToken: string): Promise<void> {
    return await this.userAuthenticationService.logoutByRefreshToken(refreshToken);
  }

  /**
   * Refresh access token menggunakan refresh token
   * @param refreshToken - Refresh token
   * @returns Object dengan access token baru
   * @throws AuthenticationError jika refresh token tidak valid
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    return await this.userAuthenticationService.refreshToken({ refreshToken });
  }

  /**
   * Ubah password user
   * @param userId - ID user
   * @param currentPassword - Password saat ini
   * @param newPassword - Password baru
   * @throws AuthenticationError jika password saat ini salah
   * @throws NotFoundError jika user tidak ditemukan
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Delegate to password service - method needs to be implemented
    throw new Error('changePassword method not implemented in PasswordService');
  }

  /**
   * Logout dari semua device
   * @param userId - ID user
   * @returns Promise<boolean> - true jika berhasil logout dari semua device
   */
  async logoutAllDevices(userId: number): Promise<boolean> {
    await this.sessionService.deactivateAllUserSessions(userId.toString());
    return true;
  }

  /**
   * Reset password user (untuk admin atau forgot password)
   * @param userId - ID user
   * @param newPassword - Password baru
   * @returns Promise<boolean> - true jika berhasil
   */
  async resetPassword(userId: number, newPassword: string): Promise<boolean> {
    // Delegate to password service - method needs to be implemented
    throw new Error('resetPassword method not implemented in PasswordService');
  }

  /**
   * Cleanup expired sessions (untuk dijadwalkan)
   * @returns Promise<number> - Jumlah session yang dihapus
   */
  async cleanupExpiredSessions(): Promise<number> {
    return await this.sessionService.cleanupExpiredSessions();
  }

  // Method private sudah dipindahkan ke service-service kecil yang sesuai
}

/**
 * Error handler khusus untuk authentication
 * Mengikuti Single Responsibility Principle
 */
export class AuthErrorHandler {
  /**
   * Membuat error response yang konsisten
   * @param message - Pesan error
   * @param statusCode - HTTP status code
   * @param context - Context tambahan untuk debugging
   * @returns ErrorResponse object
   */
  static createErrorResponse(
    message: string, 
    statusCode: number, 
    context?: Record<string, any>
  ): ErrorResponse {
    return {
      success: false,
      error: {
        message,
        statusCode,
        context
      }
    };
  }

  /**
   * Type guard untuk mengecek apakah response adalah error
   * @param response - Response object
   * @returns true jika response adalah ErrorResponse
   */
  static isErrorResponse(response: any): response is ErrorResponse {
    return response && response.success === false && response.error;
  }
}

/**
 * Utility function untuk verifikasi token dan mendapatkan user context
 * @param token - JWT token
 * @returns AuthenticatedUserContext jika valid, null jika tidak
 */
export async function verifyTokenAndGetUserContext(
  token: string
): Promise<AuthenticatedUserContext | null> {
  try {
    const authService = new AuthService();
    const payload = await authService.verifyToken(token);
    
    if (!payload) {
      return null;
    }

    const user = await userRepository.findById(payload.userId);
    if (!user || !user.active) {
      return null;
    }

    // Get user roles
    const userRoles = await userRoleRepository.findByUserId(payload.userId);
    const roles = await Promise.all(
      userRoles.map(ur => roleRepository.findById(ur.roleId))
    );
    
    const validRoles = roles.filter(Boolean);
    const roleNames = validRoles.map(role => role!.name);
    
    // Check if any role has grantsAll = true
    const hasGrantsAll = validRoles.some(role => role!.grantsAll === true);

    // Return user tanpa password hash
     const { passwordHash, ...userWithoutPassword } = user;
     
     return {
       user: userWithoutPassword,
       roles: roleNames,
       permissions: [], // TODO: Implement permission loading
       hasGrantsAll
     };
  } catch (error) {
    // Log hanya untuk error yang bukan TokenExpiredError
    if (error instanceof Error && error.name !== 'TokenExpiredError') {
      console.error('❌ Token verification failed:', error);
    }
    return null;
  }
}

/**
 * Verifikasi refresh token dan mendapatkan user context
 * @param refreshToken - Refresh token yang akan diverifikasi
 * @returns AuthenticatedUserContext jika valid, null jika tidak valid
 */
export async function verifyRefreshTokenAndGetUserContext(
  refreshToken: string
): Promise<AuthenticatedUserContext | null> {
  try {
    const authService = new AuthService();
    const payload = await authService.verifyRefreshToken(refreshToken);
    
    if (!payload) {
      return null;
    }

    const user = await userRepository.findById(payload.userId);
    if (!user || !user.active) {
      return null;
    }

    // Get user roles
    const userRoles = await userRoleRepository.findByUserId(payload.userId);
    const roles = await Promise.all(
      userRoles.map(ur => roleRepository.findById(ur.roleId))
    );
    
    const validRoles = roles.filter(Boolean);
    const roleNames = validRoles.map(role => role!.name);
    
    // Check if any role has grantsAll = true
    const hasGrantsAll = validRoles.some(role => role!.grantsAll === true);

    // Return user tanpa password hash
     const { passwordHash, ...userWithoutPassword } = user;
     
     return {
       user: userWithoutPassword,
       roles: roleNames,
       permissions: [], // TODO: Implement permission loading
       hasGrantsAll
     };
  } catch (error) {
    // Log hanya untuk error yang bukan TokenExpiredError
    if (error instanceof Error && error.name !== 'TokenExpiredError') {
      console.error('❌ Refresh token verification failed:', error);
    }
    return null;
  }
}

// Utility functions untuk backward compatibility
export async function checkUserPermission(
  userId: number,
  feature: string,
  action: string
): Promise<boolean> {
  const authService = new AuthService();
  return await authService.checkPermission(userId, feature, action);
}

export async function hasRole(userId: number, role: string): Promise<boolean> {
  const authService = new AuthService();
  return await authService.hasRole(userId, role);
}

export async function hasAnyRole(userId: number, roles: string[]): Promise<boolean> {
  const authService = new AuthService();
  return await authService.hasAnyRole(userId, roles);
}

export function createErrorResponse(message: string, statusCode: number): ErrorResponse {
  return AuthErrorHandler.createErrorResponse(message, statusCode);
}

export function isErrorResponse(response: any): response is ErrorResponse {
  return AuthErrorHandler.isErrorResponse(response);
}

// Export singleton instance
export const authService = new AuthService();
export default authService;

// Export dengan alias untuk backward compatibility
export {
  AuthService as AuthenticationService,
  authService as authenticationService
};