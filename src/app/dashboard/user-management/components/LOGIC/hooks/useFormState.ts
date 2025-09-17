import { useState, useCallback } from 'react'

/**
 * Interface untuk form state
 */
interface FormState<T> {
  data: T
  isDirty: boolean
  isValid: boolean
  errors: Record<string, string>
}

/**
 * Interface untuk form validation rules
 */
export interface ValidationRule<T> {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any, formData: T) => string | null
}

/**
 * Interface untuk form configuration
 */
export interface FormConfig<T> {
  initialData: T
  validationRules?: Partial<Record<keyof T, ValidationRule<T>>>
  validateOnChange?: boolean
}

/**
 * Interface untuk return value useFormState
 */
export interface UseFormStateReturn<T> {
  formData: T
  isDirty: boolean
  isValid: boolean
  errors: Record<string, string>
  updateField: (field: keyof T, value: any) => void
  updateFormData: (data: Partial<T>) => void
  resetForm: (newData?: T) => void
  validateForm: () => boolean
  validateField: (field: keyof T) => boolean
  setFieldError: (field: keyof T, error: string) => void
  clearFieldError: (field: keyof T) => void
  clearAllErrors: () => void
}

/**
 * Hook untuk mengelola form state dengan validation
 * Mengikuti prinsip DRY dan Single Responsibility Principle
 * 
 * @param config - Konfigurasi form dengan initial data dan validation rules
 * @returns Object dengan form data, validation state, dan utility methods
 */
export function useFormState<T extends Record<string, any>>(config: FormConfig<T>): UseFormStateReturn<T> {
  const [formData, setFormData] = useState<T>(config.initialData)
  const [isDirty, setIsDirty] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  /**
   * Validate single field with specific form data
   */
  const validateFieldWithData = useCallback((field: keyof T, formDataToValidate: T): boolean => {
    const rules = config.validationRules?.[field]
    if (!rules) return true

    const value = formDataToValidate[field]
    let error: string | null = null

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      error = `${String(field)} is required`
    }
    // Min length validation
    else if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      error = `${String(field)} must be at least ${rules.minLength} characters`
    }
    // Max length validation
    else if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      error = `${String(field)} must not exceed ${rules.maxLength} characters`
    }
    // Pattern validation
    else if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      error = `${String(field)} format is invalid`
    }
    // Custom validation - menggunakan formDataToValidate yang sudah terupdate
    else if (rules.custom) {
      error = rules.custom(value, formDataToValidate)
    }

    // Update errors state
    setErrors(prev => {
      const newErrors = { ...prev }
      if (error) {
        newErrors[String(field)] = error
      } else {
        delete newErrors[String(field)]
      }
      return newErrors
    })

    return !error
  }, [config.validationRules])

  /**
   * Validate single field
   */
  const validateField = useCallback((field: keyof T): boolean => {
    const rules = config.validationRules?.[field]
    if (!rules) return true

    const value = formData[field]
    let error: string | null = null

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      error = `${String(field)} is required`
    }
    // Min length validation
    else if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      error = `${String(field)} must be at least ${rules.minLength} characters`
    }
    // Max length validation
    else if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      error = `${String(field)} must not exceed ${rules.maxLength} characters`
    }
    // Pattern validation
    else if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      error = `${String(field)} format is invalid`
    }
    // Custom validation
    else if (rules.custom) {
      error = rules.custom(value, formData)
    }

    // Update errors state
    setErrors(prev => {
      const newErrors = { ...prev }
      if (error) {
        newErrors[String(field)] = error
      } else {
        delete newErrors[String(field)]
      }
      return newErrors
    })

    return !error
  }, [formData, config.validationRules])

  /**
   * Validate entire form
   */
  const validateForm = useCallback((): boolean => {
    if (!config.validationRules) return true

    let isFormValid = true
    const newErrors: Record<string, string> = {}

    Object.keys(config.validationRules).forEach(field => {
      const fieldKey = field as keyof T
      const rules = config.validationRules![fieldKey]
      if (!rules) return

      const value = formData[fieldKey]
      let error: string | null = null

      // Required validation
      if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        error = `${String(fieldKey)} is required`
      }
      // Min length validation
      else if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        error = `${String(fieldKey)} must be at least ${rules.minLength} characters`
      }
      // Max length validation
      else if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        error = `${String(fieldKey)} must not exceed ${rules.maxLength} characters`
      }
      // Pattern validation
      else if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        error = `${String(fieldKey)} format is invalid`
      }
      // Custom validation
      else if (rules.custom) {
        error = rules.custom(value, formData)
      }

      if (error) {
        newErrors[String(fieldKey)] = error
        isFormValid = false
      }
    })

    setErrors(newErrors)
    return isFormValid
  }, [formData, config.validationRules])

  /**
   * Update single field
   */
  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value }
      
      // Validate on change if enabled - menggunakan newFormData yang sudah terupdate
      if (config.validateOnChange) {
        setTimeout(() => {
          // Validasi field yang diubah
          validateFieldWithData(field, newFormData)
          
          // Jika field adalah password, validasi ulang confirmPassword
          if (field === 'password' && newFormData.confirmPassword) {
            validateFieldWithData('confirmPassword' as keyof T, newFormData)
          }
          // Jika field adalah confirmPassword, validasi ulang confirmPassword
          if (field === 'confirmPassword') {
            validateFieldWithData('confirmPassword' as keyof T, newFormData)
          }
        }, 0)
      }
      
      return newFormData
    })
    setIsDirty(true)
  }, [config.validateOnChange])

  /**
   * Update multiple fields
   */
  const updateFormData = useCallback((data: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...data }))
    setIsDirty(true)

    // Validate changed fields if enabled
    if (config.validateOnChange) {
      setTimeout(() => {
        Object.keys(data).forEach(field => validateField(field as keyof T))
      }, 0)
    }
  }, [config.validateOnChange, validateField])

  /**
   * Reset form to initial or new data
   */
  const resetForm = useCallback((newData?: T) => {
    const dataToSet = newData || config.initialData
    setFormData(dataToSet)
    setIsDirty(false)
    setErrors({})
  }, [config.initialData])

  /**
   * Set error for specific field
   */
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [String(field)]: error }))
  }, [])

  /**
   * Clear error for specific field
   */
  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[String(field)]
      return newErrors
    })
  }, [])

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  // Calculate if form is valid
  const isValid = Object.keys(errors).length === 0

  return {
    formData,
    isDirty,
    isValid,
    errors,
    updateField,
    updateFormData,
    resetForm,
    validateForm,
    validateField,
    setFieldError,
    clearFieldError,
    clearAllErrors
  }
}