import { ValidationError, AuthenticationError } from "../../../errors/errorHandler";
import {
  Session,
  SessionCreateData,
  SessionValidationResult,
  SessionValidationOptions,
  SessionConfig,
  DEFAULT_SESSION_CONFIG
} from "./types";

/**
 * Kelas untuk validasi session
 * Menangani semua logic validasi terkait session
 */
export class SessionValidator {
  private config: SessionConfig;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
  }

  /**
   * Validasi data untuk pembuatan session baru
   * @param data - Data session yang akan divalidasi
   * @throws ValidationError jika data tidak valid
   */
  validateSessionCreateData(data: SessionCreateData): void {
    if (!data.userId) {
      throw new ValidationError('User ID harus diisi');
    }

    if (typeof data.userId !== 'string' || data.userId.trim().length === 0) {
      throw new ValidationError('User ID harus berupa string yang tidak kosong');
    }

    if (data.expiresIn !== undefined) {
      this.validateExpiresIn(data.expiresIn);
    }

    // ipAddress and userAgent are not part of SessionCreateData interface
    // Validation removed to match interface definition
  }

  /**
   * Validasi durasi session
   * @param expiresIn - Durasi dalam detik
   * @throws ValidationError jika durasi tidak valid
   */
  validateExpiresIn(expiresIn: number): void {
    if (typeof expiresIn !== 'number' || expiresIn <= 0) {
      throw new ValidationError('Durasi session harus berupa angka positif');
    }

    const minDuration = 60; // 1 menit
    const maxDuration = 30 * 24 * 60 * 60; // 30 hari

    if (expiresIn < minDuration || expiresIn > maxDuration) {
      throw new ValidationError('Durasi session harus antara 1 menit dan 30 hari');
    }
  }

  /**
   * Validasi format IP address
   * @param ipAddress - IP address yang akan divalidasi
   * @throws ValidationError jika format tidak valid
   */
  validateIpAddress(ipAddress: string): void {
    if (typeof ipAddress !== 'string' || ipAddress.trim().length === 0) {
      throw new ValidationError('IP address harus berupa string yang tidak kosong');
    }

    // Basic IPv4 validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // Basic IPv6 validation (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    if (!ipv4Regex.test(ipAddress) && !ipv6Regex.test(ipAddress)) {
      throw new ValidationError('Format IP address tidak valid');
    }
  }

  /**
   * Validasi user agent
   * @param userAgent - User agent yang akan divalidasi
   * @throws ValidationError jika tidak valid
   */
  validateUserAgent(userAgent: string): void {
    if (typeof userAgent !== 'string') {
      throw new ValidationError('User agent harus berupa string');
    }

    if (userAgent.length > 500) {
      throw new ValidationError('User agent terlalu panjang (maksimal 500 karakter)');
    }
  }

  /**
   * Validasi session token
   * @param token - Token yang akan divalidasi
   * @throws AuthenticationError jika token tidak valid
   */
  validateSessionToken(token: string): void {
    if (!token) {
      throw new AuthenticationError('Session token tidak ditemukan');
    }

    if (typeof token !== 'string') {
      throw new AuthenticationError('Session token harus berupa string');
    }

    if (token.trim().length === 0) {
      throw new AuthenticationError('Session token tidak boleh kosong');
    }

    // Validasi format token (hex string)
    const hexRegex = /^[a-fA-F0-9]+$/;
    if (!hexRegex.test(token)) {
      throw new AuthenticationError('Format session token tidak valid');
    }

    // Validasi panjang token
    const expectedLength = 64; // Default token length (32 bytes * 2 for hex encoding)
    if (token.length !== expectedLength) {
      throw new AuthenticationError('Panjang session token tidak valid');
    }
  }

  /**
   * Validasi session object
   * @param session - Session object yang akan divalidasi
   * @param options - Opsi validasi
   * @returns Hasil validasi
   */
  validateSession(
    session: Session | null,
    options: SessionValidationOptions = {}
  ): SessionValidationResult {
    try {
      if (!session) {
        return {
          isValid: false,
          error: 'Session tidak ditemukan'
        };
      }

      // Check if session is expired (replaces isActive check)
      if (session.expiresAt <= new Date()) {
        return {
          isValid: false,
          session,
          error: 'Session sudah tidak aktif atau expired'
        };
      }



      // Validasi struktur session
      this.validateSessionStructure(session);

      return {
        isValid: true,
        session
      };
    } catch (error) {
      return {
        isValid: false,
        session: session || undefined,
        error: error instanceof Error ? error.message : 'Validasi session gagal'
      };
    }
  }

  /**
   * Validasi struktur session object
   * @param session - Session object
   * @throws ValidationError jika struktur tidak valid
   */
  private validateSessionStructure(session: Session): void {
    const requiredFields = ['id', 'userId', 'refreshToken', 'expiresAt', 'createdAt'];
    
    for (const field of requiredFields) {
      if (!(field in session) || session[field as keyof Session] === undefined) {
        throw new ValidationError(`Field '${field}' tidak ditemukan dalam session`);
      }
    }

    // Validasi tipe data
    if (typeof session.id !== 'number' || session.id <= 0) {
      throw new ValidationError('Session ID harus berupa number yang positif');
    }

    if (typeof session.userId !== 'number' || session.userId <= 0) {
      throw new ValidationError('User ID harus berupa number yang positif');
    }

    if (typeof session.refreshToken !== 'string' || session.refreshToken.trim().length === 0) {
      throw new ValidationError('Refresh token harus berupa string yang tidak kosong');
    }

    // Validasi tanggal
    if (!(session.expiresAt instanceof Date) || isNaN(session.expiresAt.getTime())) {
      throw new ValidationError('expiresAt harus berupa Date yang valid');
    }

    if (!(session.createdAt instanceof Date) || isNaN(session.createdAt.getTime())) {
      throw new ValidationError('createdAt harus berupa Date yang valid');
    }

    // Validasi logical consistency
    if (session.expiresAt <= session.createdAt) {
      throw new ValidationError('expiresAt harus lebih besar dari createdAt');
    }
  }

  /**
   * Validasi session ID
   * @param sessionId - Session ID yang akan divalidasi
   * @throws ValidationError jika tidak valid
   */
  validateSessionId(sessionId: string): void {
    if (!sessionId) {
      throw new ValidationError('Session ID tidak boleh kosong');
    }

    if (typeof sessionId !== 'string') {
      throw new ValidationError('Session ID harus berupa string');
    }

    if (sessionId.trim().length === 0) {
      throw new ValidationError('Session ID tidak boleh kosong');
    }
  }

  /**
   * Validasi user ID
   * @param userId - User ID yang akan divalidasi
   * @throws ValidationError jika tidak valid
   */
  validateUserId(userId: string): void {
    if (!userId) {
      throw new ValidationError('User ID tidak boleh kosong');
    }

    if (typeof userId !== 'string') {
      throw new ValidationError('User ID harus berupa string');
    }

    if (userId.trim().length === 0) {
      throw new ValidationError('User ID tidak boleh kosong');
    }
  }
}

/**
 * Factory function untuk membuat SessionValidator
 * @param config - Konfigurasi session (opsional)
 * @returns Instance SessionValidator
 */
export function createSessionValidator(config?: Partial<SessionConfig>): SessionValidator {
  return new SessionValidator(config);
}