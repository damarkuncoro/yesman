import { z } from "zod";
import { ValidationError } from "../errors/errorHandler";

/**
 * Interface untuk validation rule
 * Mengikuti Interface Segregation Principle
 */
export interface ValidationRule {
  field: string;
  value: any;
  rules: Array<{
    type: string;
    params?: any;
    message?: string;
  }>;
}

/**
 * Interface untuk validation result
 * Mengikuti Interface Segregation Principle
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    rule: string;
  }>;
}

/**
 * Interface untuk safe parse result
 * Mengikuti Interface Segregation Principle
 */
export interface SafeParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Unified Validator class yang menggabungkan Zod schema validation dan custom rule validation
 * Mengikuti Single Responsibility Principle dan Factory Pattern
 */
export class Validator {
  private rules: ValidationRule[] = [];

  /**
   * Add validation rule untuk rule-based validation
   * @param field - Nama field
   * @param value - Nilai yang akan divalidasi
   * @param rules - Array validation rules
   * @returns Validator instance untuk chaining
   */
  field(field: string, value: any, rules: ValidationRule['rules']): Validator {
    this.rules.push({ field, value, rules });
    return this;
  }

  /**
   * Validate semua rules yang sudah ditambahkan
   * @returns ValidationResult
   */
  validate(): ValidationResult {
    const errors: ValidationResult['errors'] = [];

    for (const rule of this.rules) {
      for (const validation of rule.rules) {
        const error = this.validateSingle(rule.field, rule.value, validation);
        if (error) {
          errors.push(error);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate dan throw error jika tidak valid
   * @throws ValidationError jika validasi gagal
   */
  validateOrThrow(): void {
    const result = this.validate();
    if (!result.isValid) {
      throw new ValidationError('Data tidak valid', result.errors);
    }
  }

  /**
   * Reset validator untuk reuse
   * @returns Validator instance untuk chaining
   */
  reset(): Validator {
    this.rules = [];
    return this;
  }

  /**
   * Validate single rule
   * @param field - Nama field
   * @param value - Nilai yang akan divalidasi
   * @param validation - Validation rule
   * @returns Error object atau null jika valid
   */
  private validateSingle(
    field: string,
    value: any,
    validation: ValidationRule['rules'][0]
  ): ValidationResult['errors'][0] | null {
    const { type, params, message } = validation;

    switch (type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          return {
            field,
            message: message || `${field} wajib diisi`,
            rule: type,
          };
        }
        break;

      case 'email':
        if (value && !this.isValidEmail(value)) {
          return {
            field,
            message: message || `${field} harus berupa email yang valid`,
            rule: type,
          };
        }
        break;

      case 'minLength':
        if (value && value.length < params) {
          return {
            field,
            message: message || `${field} minimal ${params} karakter`,
            rule: type,
          };
        }
        break;

      case 'maxLength':
        if (value && value.length > params) {
          return {
            field,
            message: message || `${field} maksimal ${params} karakter`,
            rule: type,
          };
        }
        break;

      case 'numeric':
        if (value && !this.isNumeric(value)) {
          return {
            field,
            message: message || `${field} harus berupa angka`,
            rule: type,
          };
        }
        break;

      case 'alpha':
        if (value && !this.isAlpha(value)) {
          return {
            field,
            message: message || `${field} hanya boleh berisi huruf`,
            rule: type,
          };
        }
        break;

      case 'alphanumeric':
        if (value && !this.isAlphanumeric(value)) {
          return {
            field,
            message: message || `${field} hanya boleh berisi huruf dan angka`,
            rule: type,
          };
        }
        break;

      case 'url':
        if (value && !this.isValidUrl(value)) {
          return {
            field,
            message: message || `${field} harus berupa URL yang valid`,
            rule: type,
          };
        }
        break;

      case 'phone':
        if (value && !this.isValidPhone(value)) {
          return {
            field,
            message: message || `${field} harus berupa nomor telepon yang valid`,
            rule: type,
          };
        }
        break;

      case 'min':
        if (value !== null && value !== undefined && Number(value) < params) {
          return {
            field,
            message: message || `${field} minimal ${params}`,
            rule: type,
          };
        }
        break;

      case 'max':
        if (value !== null && value !== undefined && Number(value) > params) {
          return {
            field,
            message: message || `${field} maksimal ${params}`,
            rule: type,
          };
        }
        break;

      case 'in':
        if (value && !params.includes(value)) {
          return {
            field,
            message: message || `${field} harus salah satu dari: ${params.join(', ')}`,
            rule: type,
          };
        }
        break;

      case 'regex':
        if (value && !new RegExp(params).test(value)) {
          return {
            field,
            message: message || `${field} format tidak valid`,
            rule: type,
          };
        }
        break;

      default:
        console.warn(`Unknown validation rule: ${type}`);
        break;
    }

    return null;
  }

  /**
   * Check if email is valid
   * @param email - Email string
   * @returns boolean
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if value is numeric
   * @param value - Value to check
   * @returns boolean
   */
  private isNumeric(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  /**
   * Check if string contains only alphabetic characters
   * @param value - String to check
   * @returns boolean
   */
  private isAlpha(value: string): boolean {
    return /^[a-zA-Z]+$/.test(value);
  }

  /**
   * Check if string contains only alphanumeric characters
   * @param value - String to check
   * @returns boolean
   */
  private isAlphanumeric(value: string): boolean {
    return /^[a-zA-Z0-9]+$/.test(value);
  }

  /**
   * Check if URL is valid
   * @param url - URL string
   * @returns boolean
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if phone number is valid (Indonesian format)
   * @param phone - Phone number string
   * @returns boolean
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  }

  /**
   * Validate password strength
   * @param password - Password string
   * @returns Object dengan informasi strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("Password minimal 8 karakter");
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Gunakan minimal 1 huruf besar");
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Gunakan minimal 1 huruf kecil");
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push("Gunakan minimal 1 angka");
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Gunakan minimal 1 karakter khusus");
    }

    return {
      isValid: score >= 3,
      score,
      feedback
    };
  }

  /**
   * Sanitize input string untuk mencegah XSS
   * @param input - Input string
   * @returns Sanitized string
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}

/**
 * Unified Validation Service yang menggabungkan Zod dan custom validation
 * Mengikuti Single Responsibility Principle dan Factory Pattern
 */
export class ValidationService {
  /**
   * Validasi input menggunakan Zod schema dengan error handling yang konsisten
   * @param schema - Zod schema untuk validasi
   * @param data - Data yang akan divalidasi
   * @returns Data yang sudah divalidasi
   * @throws ValidationError jika validasi gagal
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map((err: z.ZodIssue) => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        throw new ValidationError(`Validation error: ${errorMessages}`);
      }
      throw error;
    }
  }

  /**
   * Validasi input dengan safe parsing (tidak throw error)
   * @param schema - Zod schema untuk validasi
   * @param data - Data yang akan divalidasi
   * @returns Object dengan success flag dan data/error
   */
  static safeParse<T>(schema: z.ZodSchema<T>, data: unknown): SafeParseResult<T> {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errorMessages = result.error.issues.map((err: z.ZodIssue) => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      return { success: false, error: errorMessages };
    }
  }

  /**
   * Validasi array of data dengan schema yang sama
   * @param schema - Zod schema untuk validasi
   * @param dataArray - Array data yang akan divalidasi
   * @returns Array data yang sudah divalidasi
   * @throws ValidationError jika ada data yang tidak valid
   */
  static validateArray<T>(schema: z.ZodSchema<T>, dataArray: unknown[]): T[] {
    return dataArray.map((data, index) => {
      try {
        return this.validate(schema, data);
      } catch (error) {
        throw new ValidationError(
          `Validation error at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  /**
   * Validasi partial update data (mengabaikan field yang undefined)
   * @param schema - Zod schema untuk validasi
   * @param data - Data yang akan divalidasi
   * @returns Data yang sudah divalidasi dengan field undefined dihapus
   */
  static validatePartial<T>(schema: z.ZodSchema<T>, data: unknown): Partial<T> {
    const validatedData = this.validate(schema, data);
    // Remove undefined fields
    const cleanedData: Partial<T> = {};
    Object.entries(validatedData as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined) {
        (cleanedData as Record<string, unknown>)[key] = value;
      }
    });
    return cleanedData;
  }

  /**
   * Validasi email format
   * @param email - Email yang akan divalidasi
   * @returns true jika email valid
   */
  static isValidEmail(email: string): boolean {
    const emailSchema = z.string().email();
    return emailSchema.safeParse(email).success;
  }

  /**
   * Validasi dan sanitize input string
   * @param input - Input yang akan divalidasi dan disanitize
   * @returns Input yang sudah divalidasi dan disanitize
   */
  static validateAndSanitizeString(input: unknown): string {
    const validatedInput = this.validate(z.string(), input);
    return Validator.sanitizeInput(validatedInput);
  }

  /**
   * Create validator instance untuk rule-based validation
   * @returns Validator instance
   */
  static createValidator(): Validator {
    return new Validator();
  }

  /**
   * Quick validation menggunakan rule-based approach
   * @param data - Data object yang akan divalidasi
   * @param rules - Rules object dengan field sebagai key
   * @returns ValidationResult
   */
  static quickValidate(
    data: Record<string, any>,
    rules: Record<string, ValidationRule['rules']>
  ): ValidationResult {
    const validator = new Validator();
    
    Object.entries(rules).forEach(([field, fieldRules]) => {
      validator.field(field, data[field], fieldRules);
    });
    
    return validator.validate();
  }

  /**
   * Quick validation yang throw error jika tidak valid
   * @param data - Data object yang akan divalidasi
   * @param rules - Rules object dengan field sebagai key
   * @throws ValidationError jika validasi gagal
   */
  static quickValidateOrThrow(
    data: Record<string, any>,
    rules: Record<string, ValidationRule['rules']>
  ): void {
    const result = this.quickValidate(data, rules);
    if (!result.isValid) {
      throw new ValidationError('Data tidak valid', result.errors);
    }
  }
}

/**
 * Utility functions untuk validasi cepat
 * Mengikuti Factory Pattern dan DRY principle
 */
export const validate = {
  /**
   * Validate email format
   */
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Check if value is required (not empty)
   */
  required: (value: any): boolean => {
    return value !== null && value !== undefined && value !== '' && value !== false;
  },

  /**
   * Check minimum length
   */
  minLength: (value: string, min: number): boolean => {
    return !value && value.length >= min;
  },

  /**
   * Check maximum length
   */
  maxLength: (value: string, max: number): boolean => {
    return !value || value.length <= max;
  },

  /**
   * Check if value is numeric
   */
  numeric: (value: any): boolean => {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },

  /**
   * Validate URL format
   */
  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate phone number (Indonesian format)
   */
  phone: (phone: string): boolean => {
    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  },
};

/**
 * Factory function untuk membuat validator instance
 * @returns Validator instance
 */
export function createValidator(): Validator {
  return new Validator();
}

/**
 * Quick validation function
 * @param data - Data object yang akan divalidasi
 * @param rules - Rules object dengan field sebagai key
 * @returns ValidationResult
 */
export function quickValidate(
  data: Record<string, any>,
  rules: Record<string, ValidationRule['rules']>
): ValidationResult {
  return ValidationService.quickValidate(data, rules);
}

/**
 * Quick validation function yang throw error jika tidak valid
 * @param data - Data object yang akan divalidasi
 * @param rules - Rules object dengan field sebagai key
 * @throws ValidationError jika validasi gagal
 */
export function quickValidateOrThrow(
  data: Record<string, any>,
  rules: Record<string, ValidationRule['rules']>
): void {
  ValidationService.quickValidateOrThrow(data, rules);
}

// Export default
export default ValidationService;

// Export untuk backward compatibility
export {
  ValidationService as ValidatorService,
  Validator as CustomValidator
};