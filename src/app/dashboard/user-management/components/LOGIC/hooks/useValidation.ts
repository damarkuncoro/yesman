import { useMemo, useCallback } from 'react'

/**
 * Interface untuk validation rule
 */
export interface ValidationRule<T = any> {
  name: string
  message: string
  validator: (value: T, formData?: Record<string, any>) => boolean
}

/**
 * Interface untuk validation result
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Interface untuk field validation result
 */
export interface FieldValidationResult {
  [fieldName: string]: ValidationResult
}

/**
 * Interface untuk validation schema
 */
export interface ValidationSchema {
  [fieldName: string]: ValidationRule[]
}

/**
 * Predefined validation rules yang umum digunakan
 * Mengikuti prinsip DRY dengan menyediakan rules yang reusable
 */
export const commonValidationRules = {
  /**
   * Rule untuk field yang required
   */
  required: (message: string = 'Field ini wajib diisi'): ValidationRule => ({
    name: 'required',
    message,
    validator: (value) => {
      if (typeof value === 'string') return value.trim().length > 0
      if (Array.isArray(value)) return value.length > 0
      return value !== null && value !== undefined
    }
  }),

  /**
   * Rule untuk minimum length
   */
  minLength: (min: number, message?: string): ValidationRule => ({
    name: 'minLength',
    message: message || `Minimal ${min} karakter`,
    validator: (value) => {
      if (typeof value !== 'string') return true
      return value.length >= min
    }
  }),

  /**
   * Rule untuk maximum length
   */
  maxLength: (max: number, message?: string): ValidationRule => ({
    name: 'maxLength',
    message: message || `Maksimal ${max} karakter`,
    validator: (value) => {
      if (typeof value !== 'string') return true
      return value.length <= max
    }
  }),

  /**
   * Rule untuk email format
   */
  email: (message: string = 'Format email tidak valid'): ValidationRule => ({
    name: 'email',
    message,
    validator: (value) => {
      if (typeof value !== 'string') return true
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    }
  }),

  /**
   * Rule untuk password strength
   */
  strongPassword: (message: string = 'Password harus mengandung minimal 8 karakter, 1 huruf besar, 1 huruf kecil, dan 1 angka'): ValidationRule => ({
    name: 'strongPassword',
    message,
    validator: (value) => {
      if (typeof value !== 'string') return true
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
      return strongPasswordRegex.test(value)
    }
  }),

  /**
   * Rule untuk numeric values
   */
  numeric: (message: string = 'Harus berupa angka'): ValidationRule => ({
    name: 'numeric',
    message,
    validator: (value) => {
      if (value === '' || value === null || value === undefined) return true
      return !isNaN(Number(value))
    }
  }),

  /**
   * Rule untuk minimum value
   */
  min: (minValue: number, message?: string): ValidationRule => ({
    name: 'min',
    message: message || `Nilai minimal ${minValue}`,
    validator: (value) => {
      if (value === '' || value === null || value === undefined) return true
      return Number(value) >= minValue
    }
  }),

  /**
   * Rule untuk maximum value
   */
  max: (maxValue: number, message?: string): ValidationRule => ({
    name: 'max',
    message: message || `Nilai maksimal ${maxValue}`,
    validator: (value) => {
      if (value === '' || value === null || value === undefined) return true
      return Number(value) <= maxValue
    }
  }),

  /**
   * Rule untuk custom regex pattern
   */
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    name: 'pattern',
    message,
    validator: (value) => {
      if (typeof value !== 'string') return true
      return regex.test(value)
    }
  }),

  /**
   * Rule untuk confirm password
   */
  confirmPassword: (passwordField: string, message: string = 'Password tidak cocok'): ValidationRule => ({
    name: 'confirmPassword',
    message,
    validator: (value, formData) => {
      if (!formData) return true
      return value === formData[passwordField]
    }
  })
}

/**
 * Hook untuk validation yang mengikuti prinsip SOLID dan DRY
 * Single Responsibility: Hanya menangani validation logic
 * Open/Closed: Dapat diperluas dengan custom rules tanpa mengubah kode existing
 * 
 * @param schema - Schema validation untuk form
 * @returns Object dengan method untuk validate field dan form
 */
export function useValidation(schema: ValidationSchema) {
  // Memoize schema untuk performance
  const memoizedSchema = useMemo(() => schema, [JSON.stringify(schema)])

  /**
   * Validate single field berdasarkan rules yang didefinisikan
   */
  const validateField = useCallback((
    fieldName: string, 
    value: any, 
    formData?: Record<string, any>
  ): ValidationResult => {
    const rules = memoizedSchema[fieldName]
    
    if (!rules || rules.length === 0) {
      return { isValid: true, errors: [] }
    }

    const errors: string[] = []

    for (const rule of rules) {
      try {
        const isValid = rule.validator(value, formData)
        if (!isValid) {
          errors.push(rule.message)
        }
      } catch (error) {
        console.error(`Validation error for rule ${rule.name}:`, error)
        errors.push(`Validation error: ${rule.name}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }, [memoizedSchema])

  /**
   * Validate seluruh form berdasarkan schema
   */
  const validateForm = useCallback((formData: Record<string, any>): FieldValidationResult => {
    const results: FieldValidationResult = {}

    // Validate setiap field yang ada di schema
    Object.keys(memoizedSchema).forEach(fieldName => {
      const fieldValue = formData[fieldName]
      results[fieldName] = validateField(fieldName, fieldValue, formData)
    })

    return results
  }, [memoizedSchema, validateField])

  /**
   * Check apakah form valid secara keseluruhan
   */
  const isFormValid = useCallback((formData: Record<string, any>): boolean => {
    const validationResults = validateForm(formData)
    return Object.values(validationResults).every(result => result.isValid)
  }, [validateForm])

  /**
   * Get semua error messages dari validation result
   */
  const getFormErrors = useCallback((validationResults: FieldValidationResult): string[] => {
    const allErrors: string[] = []
    
    Object.values(validationResults).forEach(result => {
      allErrors.push(...result.errors)
    })

    return allErrors
  }, [])

  /**
   * Create custom validation rule
   */
  const createCustomRule = useCallback((
    name: string,
    message: string,
    validator: (value: any, formData?: Record<string, any>) => boolean
  ): ValidationRule => ({
    name,
    message,
    validator
  }), [])

  return {
    validateField,
    validateForm,
    isFormValid,
    getFormErrors,
    createCustomRule,
    commonRules: commonValidationRules
  }
}

/**
 * Hook untuk real-time validation
 * Mengikuti prinsip Single Responsibility dengan fokus pada real-time validation
 */
export function useRealtimeValidation(
  schema: ValidationSchema,
  formData: Record<string, any>,
  options: {
    validateOnChange?: boolean
    validateOnBlur?: boolean
    debounceMs?: number
  } = {}
) {
  const { validateField, validateForm, isFormValid } = useValidation(schema)
  
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300
  } = options

  // Memoize validation results untuk performance
  const validationResults = useMemo(() => {
    if (validateOnChange) {
      return validateForm(formData)
    }
    return {}
  }, [formData, validateForm, validateOnChange])

  const isValid = useMemo(() => {
    return isFormValid(formData)
  }, [formData, isFormValid])

  /**
   * Get validation result untuk specific field
   */
  const getFieldValidation = useCallback((fieldName: string): ValidationResult => {
    return validationResults[fieldName] || { isValid: true, errors: [] }
  }, [validationResults])

  /**
   * Check apakah field memiliki error
   */
  const hasFieldError = useCallback((fieldName: string): boolean => {
    const result = getFieldValidation(fieldName)
    return !result.isValid
  }, [getFieldValidation])

  /**
   * Get error message untuk field
   */
  const getFieldError = useCallback((fieldName: string): string | null => {
    const result = getFieldValidation(fieldName)
    return result.errors.length > 0 ? result.errors[0] : null
  }, [getFieldValidation])

  return {
    validationResults,
    isValid,
    getFieldValidation,
    hasFieldError,
    getFieldError,
    validateField: (fieldName: string, value: any) => validateField(fieldName, value, formData)
  }
}