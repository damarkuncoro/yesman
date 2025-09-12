import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ValidationService } from "../validation/validator";
import { ErrorHandler, ValidationError, AuthenticationError, NotFoundError, ConflictError } from "../errors/errorHandler";
import { userCreateSchema, userLoginSchema } from "../validation/schemas";
import { userRepository, sessionRepository, userRoleRepository, roleRepository } from "@/repositories";
import type { User } from "@/db/schema";
import type { 
  JWTPayload, 
  AuthResponse, 
  IAuthService, 
  AuthenticatedUserContext,
  ErrorResponse 
} from "./types";

/**
 * Unified Authentication Service
 * Mengikuti Single Responsibility Principle dan Open/Closed Principle
 * Menggabungkan semua authentication logic dari berbagai tempat
 * Menerapkan Dependency Inversion Principle dengan interface
 */
export class AuthService implements IAuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly SALT_ROUNDS = 12;
  private readonly ACCESS_TOKEN_EXPIRES = '15m';
  private readonly REFRESH_TOKEN_EXPIRES = '7d';

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
    
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.warn('⚠️ JWT secrets not properly configured');
    }
  }

  /**
   * Verifikasi JWT token dan return payload
   * @param token - JWT token yang akan diverifikasi
   * @returns JWTPayload jika valid, null jika tidak valid
   */
  async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as JWTPayload;
      
      // Validasi apakah user masih aktif
      const user = await userRepository.findById(payload.userId);
      if (!user || !user.active) {
        return null;
      }
      
      return payload;
    } catch (error) {
      // Log hanya untuk error yang bukan TokenExpiredError
      if (error instanceof Error && error.name !== 'TokenExpiredError') {
        console.error('❌ Token verification failed:', error);
      }
      return null;
    }
  }

  /**
   * Verifikasi refresh token
   * @param token - Refresh token yang akan diverifikasi
   * @returns JWTPayload jika valid
   * @throws AuthenticationError jika tidak valid
   */
  async verifyRefreshToken(token: string): Promise<JWTPayload> {
    try {
      return jwt.verify(token, this.JWT_REFRESH_SECRET) as JWTPayload;
    } catch (error) {
      // Log hanya untuk error yang bukan TokenExpiredError
      if (error instanceof Error && error.name !== 'TokenExpiredError') {
        console.error('❌ Refresh token verification failed:', error);
      }
      throw new AuthenticationError('Refresh token tidak valid');
    }
  }

  /**
   * Mendapatkan ringkasan permission user
   * @param userId - ID user
   * @returns Object berisi roles dan permissions
   */
  async getUserPermissionSummary(userId: number): Promise<any> {
    try {
      const userRoles = await userRoleRepository.findByUserId(userId);
      const roles = await Promise.all(
        userRoles.map(ur => roleRepository.findById(ur.roleId))
      );
      
      return {
        userId,
        roles: roles.filter(Boolean).map(role => ({
           id: role!.id,
           name: role!.name,
           grantsAll: role!.grantsAll
         }))
      };
    } catch (error) {
      console.error('❌ Failed to get user permission summary:', error);
      return { userId, roles: [] };
    }
  }

  /**
   * Memeriksa apakah user memiliki permission untuk feature dan action tertentu
   * @param userId - ID user
   * @param feature - Nama feature
   * @param action - Action yang akan dilakukan
   * @returns true jika memiliki permission, false jika tidak
   */
  async checkPermission(userId: number, feature: string, action: string): Promise<boolean> {
    try {
      const userRoles = await userRoleRepository.findByUserId(userId);
      if (!userRoles || userRoles.length === 0) {
        return false;
      }
      
      // Untuk sementara, return true jika user memiliki role
      // TODO: Implementasi feature-based permission checking
      return userRoles.length > 0;
    } catch (error) {
      console.error('❌ Permission check failed:', error);
      return false;
    }
  }

  /**
   * Memeriksa apakah user memiliki role tertentu
   * @param userId - ID user
   * @param role - Nama role
   * @returns true jika memiliki role, false jika tidak
   */
  async hasRole(userId: number, role: string): Promise<boolean> {
    try {
      const userRoles = await userRoleRepository.findByUserId(userId);
      const roles = await Promise.all(
        userRoles.map(ur => roleRepository.findById(ur.roleId))
      );
      
      return roles.some(r => r?.name === role);
    } catch (error) {
      console.error('❌ Role check failed:', error);
      return false;
    }
  }

  /**
   * Memeriksa apakah user memiliki salah satu dari roles yang diberikan
   * @param userId - ID user
   * @param roles - Array nama roles
   * @returns true jika memiliki salah satu role, false jika tidak
   */
  async hasAnyRole(userId: number, roles: string[]): Promise<boolean> {
    try {
      const userRoles = await userRoleRepository.findByUserId(userId);
      const userRoleObjects = await Promise.all(
        userRoles.map(ur => roleRepository.findById(ur.roleId))
      );
      
      const userRoleNames = userRoleObjects
        .filter(Boolean)
        .map(role => role!.name);
      
      return roles.some(role => userRoleNames.includes(role));
    } catch (error) {
      console.error('❌ Role check failed:', error);
      return false;
    }
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
    try {
      // Validasi input
      const validatedData = ValidationService.validate(userCreateSchema, userData);

      // Cek apakah email sudah ada
      const existingUser = await userRepository.findByEmail(validatedData.email);
      if (existingUser) {
        throw new ConflictError(`User dengan email ${validatedData.email} sudah ada`);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(validatedData.password, this.SALT_ROUNDS);

      // Buat user baru
      const newUser = await userRepository.create({
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Assign role default
      await this.assignDefaultRole(newUser);

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens({
        userId: newUser.id,
        email: newUser.email
      });

      // Simpan refresh token
      await sessionRepository.create({
        userId: newUser.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari
        createdAt: new Date()
      });

      // Return response tanpa password hash
      const { passwordHash: _, ...userWithoutPassword } = newUser;
      
      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken
      };
    } catch (error) {
      throw ErrorHandler.handleError(error, 'register user');
    }
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
      // Validasi input
      const validatedData = ValidationService.validate(userLoginSchema, loginData);

      // Cari user berdasarkan email
      const user = await userRepository.findByEmail(validatedData.email);
      if (!user) {
        throw new AuthenticationError('Email atau password salah');
      }

      // Cek apakah user aktif
      if (!user.active) {
        throw new AuthenticationError('Akun tidak aktif');
      }

      // Verifikasi password
      const isPasswordValid = await bcrypt.compare(
        validatedData.password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        throw new AuthenticationError('Email atau password salah');
      }

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens({
        userId: user.id,
        email: user.email
      });

      // Simpan refresh token
      await sessionRepository.create({
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari
        createdAt: new Date()
      });

      // Return response tanpa password hash
      const { passwordHash: _, ...userWithoutPassword } = user;
      
      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken
      };
    } catch (error) {
      throw ErrorHandler.handleError(error, 'login user');
    }
  }

  /**
   * Logout user dengan menghapus refresh token
   * @param refreshToken - Refresh token yang akan dihapus
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await sessionRepository.deleteByRefreshToken(refreshToken);
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Tidak throw error karena logout harus selalu berhasil
    }
  }

  /**
   * Refresh access token menggunakan refresh token
   * @param refreshToken - Refresh token
   * @returns Object dengan access token baru
   * @throws AuthenticationError jika refresh token tidak valid
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verifikasi refresh token
      const payload = await this.verifyRefreshToken(refreshToken);

      // Cek apakah session masih valid
      const session = await sessionRepository.findByRefreshToken(refreshToken);
      if (!session) {
        throw new AuthenticationError('Session tidak valid');
      }

      // Cek apakah session sudah expired
      if (session.expiresAt < new Date()) {
        await sessionRepository.deleteByRefreshToken(refreshToken);
        throw new AuthenticationError('Session sudah expired');
      }

      // Cek apakah user masih aktif
      const user = await userRepository.findById(payload.userId);
      if (!user || !user.active) {
        throw new AuthenticationError('User tidak ditemukan atau tidak aktif');
      }

      // Generate access token baru
      const accessToken = jwt.sign(
        { userId: payload.userId, email: payload.email },
        this.JWT_SECRET,
        { expiresIn: this.ACCESS_TOKEN_EXPIRES }
      );

      return { accessToken };
    } catch (error) {
      throw ErrorHandler.handleError(error, 'refresh access token');
    }
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
    try {
      // Validasi password strength
      const passwordValidation = ValidationService.createValidator()
        .field('newPassword', newPassword, [
          { type: 'required', message: 'Password baru wajib diisi' },
          { type: 'minLength', params: 8, message: 'Password minimal 8 karakter' }
        ])
        .validate();

      if (!passwordValidation.isValid) {
        throw new ValidationError('Password tidak valid', passwordValidation.errors);
      }

      // Cari user
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError(`User dengan ID ${userId} tidak ditemukan`);
      }

      // Verifikasi password saat ini
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash
      );

      if (!isCurrentPasswordValid) {
        throw new AuthenticationError('Password saat ini salah');
      }

      // Hash password baru
      const newPasswordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Update password
      await userRepository.update(userId, {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      });

      // Hapus semua session untuk memaksa login ulang
      await sessionRepository.deleteByUserId(userId);
    } catch (error) {
      throw ErrorHandler.handleError(error, 'change password');
    }
  }

  /**
   * Logout dari semua device
   * @param userId - ID user
   * @returns Promise<boolean> - true jika berhasil logout dari semua device
   */
  async logoutAllDevices(userId: number): Promise<boolean> {
    try {
      await sessionRepository.deleteByUserId(userId);
      return true;
    } catch (error) {
      console.error('❌ Logout all devices failed:', error);
      return false;
    }
  }

  /**
   * Reset password user (untuk admin atau forgot password)
   * @param userId - ID user
   * @param newPassword - Password baru
   * @returns Promise<boolean> - true jika berhasil
   */
  async resetPassword(userId: number, newPassword: string): Promise<boolean> {
    try {
      // Validasi password baru
      if (!newPassword || newPassword.length < 8) {
        throw new ValidationError('New password must be at least 8 characters long');
      }

      // Hash password baru
      const newPasswordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Update password
      const updated = await userRepository.update(userId, {
        passwordHash: newPasswordHash
      });

      if (updated) {
        // Logout dari semua device untuk keamanan
        await this.logoutAllDevices(userId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Reset password failed:', error);
      return false;
    }
  }

  /**
   * Cleanup expired sessions (untuk dijadwalkan)
   * @returns Promise<number> - Jumlah session yang dihapus
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      return await sessionRepository.deleteExpiredSessions();
    } catch (error) {
      console.error('❌ Cleanup expired sessions failed:', error);
      return 0;
    }
  }

  /**
   * Assign role default berdasarkan urutan user
   * @param user - User yang baru dibuat
   */
  private async assignDefaultRole(user: User): Promise<void> {
    try {
      // Cek apakah ini user pertama di sistem
      const allUsers = await userRepository.findAll();
      const totalUsers = allUsers.length;
      
      if (totalUsers === 1) {
        // User pertama mendapat role Administrator
        const adminRole = await roleRepository.findByName('administrator');
        if (adminRole) {
          await userRoleRepository.create({
            userId: user.id,
            roleId: adminRole.id
          });
          console.log(`🔑 User pertama '${user.email}' mendapat role Administrator`);
        } else {
          console.warn('⚠️  Role "administrator" tidak ditemukan. Jalankan seeding RBAC.');
        }
      } else {
        // User selanjutnya mendapat role default 'user'
        const userRole = await roleRepository.findByName('user');
        if (userRole) {
          await userRoleRepository.create({
            userId: user.id,
            roleId: userRole.id
          });
          console.log(`✅ Role 'user' berhasil di-assign ke user ${user.email}`);
        } else {
          console.warn('⚠️  Role default "user" tidak ditemukan. Jalankan seeding RBAC.');
        }
      }
    } catch (error) {
      console.error('❌ Error saat assign role default:', error);
      // Tidak throw error karena user sudah berhasil dibuat
    }
  }

  /**
   * Generate access dan refresh tokens
   * @param payload - Data yang akan disimpan dalam token
   * @returns Object dengan accessToken dan refreshToken
   */
  private generateTokens(payload: { userId: number; email: string }): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES
    });

    const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES
    });

    return { accessToken, refreshToken };
  }

  /**
   * Menghapus password hash dari user object
   * @param user - User object
   * @returns User tanpa password hash
   */
  private sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
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
    
    const roleNames = roles.filter(Boolean).map(role => role!.name);

    // Return user tanpa password hash
     const { passwordHash, ...userWithoutPassword } = user;
     
     return {
       user: userWithoutPassword,
       roles: roleNames,
       permissions: [], // TODO: Implement permission loading
       hasGrantsAll: roleNames.includes('super_admin') || roleNames.includes('administrator')
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
    
    const roleNames = roles.filter(Boolean).map(role => role!.name);

    // Return user tanpa password hash
     const { passwordHash, ...userWithoutPassword } = user;
     
     return {
       user: userWithoutPassword,
       roles: roleNames,
       permissions: [], // TODO: Implement permission loading
       hasGrantsAll: roleNames.includes('super_admin') || roleNames.includes('administrator')
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
  return authService.checkPermission(userId, feature, action);
}

export async function hasRole(userId: number, role: string): Promise<boolean> {
  const authService = new AuthService();
  return authService.hasRole(userId, role);
}

export async function hasAnyRole(userId: number, roles: string[]): Promise<boolean> {
  const authService = new AuthService();
  return authService.hasAnyRole(userId, roles);
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