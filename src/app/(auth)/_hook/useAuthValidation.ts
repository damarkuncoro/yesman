import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

/**
 * Interface untuk aturan validasi
 */
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => string | null
}

/**
 * Interface untuk konfigurasi validasi field
 */
export interface ValidationConfig {
  [fieldName: string]: ValidationRule
}

/**
 * Interface untuk hasil validasi
 */
export interface ValidationResult {
  isValid: boolean
  errors: { [fieldName: string]: string }
}

/**
 * Custom hook untuk mengelola validasi form authentication
 * Mengikuti prinsip SRP dan DRY untuk validasi yang dapat digunakan kembali
 * 
 * @param config - Konfigurasi validasi untuk setiap field
 * @returns Object berisi methods dan state untuk validasi form
 */
export const useAuthValidation = (config: ValidationConfig) => {
  const [errors, setErrors] = useState<{ [fieldName: string]: string }>({})
  const [touched, setTouched] = useState<{ [fieldName: string]: boolean }>({})

  /**
   * Method untuk memvalidasi single field
   * @param fieldName - Nama field yang akan divalidasi
   * @param value - Nilai field yang akan divalidasi
   * @returns Pesan error atau null jika valid
   */
  const validateField = useCallback((fieldName: string, value: string): string | null => {
    const rule = config[fieldName]
    if (!rule) return null

    // Validasi required
    if (rule.required && (!value || value.trim() === '')) {
      return `${fieldName} wajib diisi`
    }

    // Skip validasi lain jika field kosong dan tidak required
    if (!value || value.trim() === '') {
      return null
    }

    // Validasi minimum length
    if (rule.minLength && value.length < rule.minLength) {
      return `${fieldName} minimal ${rule.minLength} karakter`
    }

    // Validasi maximum length
    if (rule.maxLength && value.length > rule.maxLength) {
      return `${fieldName} maksimal ${rule.maxLength} karakter`
    }

    // Validasi pattern (regex)
    if (rule.pattern && !rule.pattern.test(value)) {
      return `Format ${fieldName} tidak valid`
    }

    // Validasi custom
    if (rule.custom) {
      return rule.custom(value)
    }

    return null
  }, [config])

  /**
   * Method untuk memvalidasi semua field dalam form data
   * @param formData - Data form yang akan divalidasi
   * @returns Hasil validasi dengan status dan errors
   */
  const validateForm = useCallback((formData: { [fieldName: string]: string }): ValidationResult => {
    const newErrors: { [fieldName: string]: string } = {}

    Object.keys(config).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName] || '')
      if (error) {
        newErrors[fieldName] = error
      }
    })

    setErrors(newErrors)
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    }
  }, [config, validateField])

  /**
   * Method untuk menangani perubahan field dan validasi real-time
   * @param fieldName - Nama field yang berubah
   * @param value - Nilai baru field
   */
  const handleFieldChange = useCallback((fieldName: string, value: string) => {
    // Tandai field sebagai touched
    setTouched(prev => ({ ...prev, [fieldName]: true }))

    // Validasi field jika sudah pernah touched
    if (touched[fieldName]) {
      const error = validateField(fieldName, value)
      setErrors(prev => ({
        ...prev,
        [fieldName]: error || ''
      }))
    }
  }, [touched, validateField])

  /**
   * Method untuk menangani blur field
   * @param fieldName - Nama field yang di-blur
   * @param value - Nilai field saat di-blur
   */
  const handleFieldBlur = useCallback((fieldName: string, value: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    const error = validateField(fieldName, value)
    setErrors(prev => ({
      ...prev,
      [fieldName]: error || ''
    }))
  }, [validateField])

  /**
   * Method untuk mereset state validasi
   */
  const resetValidation = useCallback(() => {
    setErrors({})
    setTouched({})
  }, [])

  /**
   * Method untuk mendapatkan error message untuk field tertentu
   * @param fieldName - Nama field
   * @returns Error message atau undefined
   */
  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return touched[fieldName] ? errors[fieldName] : undefined
  }, [errors, touched])

  /**
   * Computed property untuk mengecek apakah form memiliki error
   */
  const hasErrors = useMemo(() => {
    return Object.values(errors).some(error => error && error.trim() !== '')
  }, [errors])

  /**
   * Method untuk menampilkan toast notification untuk error validasi
   * @param errors - Object berisi error messages
   */
  const showValidationToast = useCallback((errors: { [fieldName: string]: string }) => {
    const errorMessages = Object.values(errors).filter(error => error && error.trim() !== '')
    if (errorMessages.length > 0) {
      // Tampilkan error pertama sebagai toast
      toast.error(errorMessages[0])
    }
  }, [])

  /**
   * Method untuk menampilkan toast success untuk validasi berhasil
   * @param message - Pesan success yang akan ditampilkan
   */
  const showSuccessToast = useCallback((message: string) => {
    toast.success(message)
  }, [])

  /**
   * Method untuk memvalidasi semua field dalam form data dengan toast notification
   * @param formData - Data form yang akan divalidasi
   * @param showToast - Apakah menampilkan toast untuk error (default: true)
   * @returns Hasil validasi dengan status dan errors
   */
  const validateFormWithToast = useCallback((
    formData: { [fieldName: string]: string }, 
    showToast: boolean = true
  ): ValidationResult => {
    const result = validateForm(formData)
    
    if (!result.isValid && showToast) {
      showValidationToast(result.errors)
    }
    
    return result
  }, [validateForm, showValidationToast])

  return {
    errors,
    touched,
    hasErrors,
    validateField,
    validateForm,
    validateFormWithToast,
    handleFieldChange,
    handleFieldBlur,
    resetValidation,
    getFieldError,
    showValidationToast,
    showSuccessToast
  }
}

/**
 * Predefined validation rules untuk field authentication yang umum
 */
export const authValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !value.includes('@')) {
        return 'Email harus mengandung karakter @'
      }
      return null
    }
  },
  password: {
    required: true,
    minLength: 6,
    custom: (value: string) => {
      if (value && value.length < 6) {
        return 'Password minimal 6 karakter'
      }
      // if (value && !/(?=.*[a-z])(?=.*[A-Z])/.test(value)) {
      //   return 'Password harus mengandung huruf besar dan kecil'
      // }
      return null
    }
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50
  },
  confirmPassword: {
    required: true,
    custom: (value: string, formData?: { password: string }) => {
      if (formData && value !== formData.password) {
        return 'Konfirmasi password tidak cocok'
      }
      return null
    }
  }
}

export default useAuthValidation