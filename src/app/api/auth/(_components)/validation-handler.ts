import { z } from "zod";
import { ValidationResult, ValidationSchema } from './types';

/**
 * Class untuk menangani validasi input secara terpusat
 * Menerapkan Single Responsibility Principle (SRP)
 */
export class AuthValidationHandler {
  /**
   * Validasi data menggunakan Zod schema
   */
  static validate<T>(
    data: unknown,
    schema: ValidationSchema
  ): ValidationResult<T> {
    try {
      const validatedData = schema.parse(data) as T;
      return {
        success: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map((err: z.ZodIssue) => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        
        return {
          success: false,
          error: `Validation failed: ${errorMessages}`,
        };
      }
      
      return {
        success: false,
        error: 'Unknown validation error',
      };
    }
  }

  /**
   * Validasi login data
   */
  static validateLoginData(data: unknown): ValidationResult<{
    email: string;
    password: string;
  }> {
    const loginSchema = z.object({
      email: z.string().email("Format email tidak valid"),
      password: z.string().min(6, "Password minimal 6 karakter"),
    });

    return this.validate(data, loginSchema);
  }

  /**
   * Validasi register data
   */
  static validateRegisterData(data: unknown): ValidationResult<{
    name: string;
    email: string;
    password: string;
  }> {
    const registerSchema = z.object({
      name: z.string().min(2, "Nama minimal 2 karakter"),
      email: z.string().email("Format email tidak valid"),
      password: z.string().min(6, "Password minimal 6 karakter"),
    });

    return this.validate(data, registerSchema);
  }

  /**
   * Validasi access validation data (route-based)
   */
  static validateAccessData(data: unknown): ValidationResult<{
    userId: number;
    route: string;
    action: "create" | "read" | "update" | "delete";
  }> {
    const accessSchema = z.object({
      userId: z.number().int().positive("User ID harus berupa integer positif"),
      route: z.string().min(1, "Route harus diisi"),
      action: z.enum(["create", "read", "update", "delete"], {
        message: "Action harus salah satu dari: create, read, update, delete"
      })
    });

    return this.validate(data, accessSchema);
  }

  /**
   * Validasi feature validation data (feature-based)
   */
  static validateFeatureData(data: unknown): ValidationResult<{
    userId: number;
    featureId: number;
    action: "create" | "read" | "update" | "delete";
  }> {
    const featureSchema = z.object({
      userId: z.number().int().positive("User ID harus berupa integer positif"),
      featureId: z.number().int().positive("Feature ID harus berupa integer positif"),
      action: z.enum(["create", "read", "update", "delete"], {
        message: "Action harus salah satu dari: create, read, update, delete"
      })
    });

    return this.validate(data, featureSchema);
  }

  /**
   * Validasi refresh token presence
   */
  static validateRefreshToken(refreshToken: string | null): ValidationResult<string> {
    if (!refreshToken) {
      return {
        success: false,
        error: "Refresh token tidak ditemukan dalam cookie",
      };
    }

    if (typeof refreshToken !== 'string' || refreshToken.trim() === '') {
      return {
        success: false,
        error: "Refresh token tidak valid",
      };
    }

    return {
      success: true,
      data: refreshToken,
    };
  }

  /**
   * Validasi access token presence
   */
  static validateAccessToken(accessToken: string | null): ValidationResult<string> {
    if (!accessToken) {
      return {
        success: false,
        error: "Access token tidak ditemukan dalam header Authorization",
      };
    }

    if (typeof accessToken !== 'string' || accessToken.trim() === '') {
      return {
        success: false,
        error: "Access token tidak valid",
      };
    }

    return {
      success: true,
      data: accessToken,
    };
  }
}