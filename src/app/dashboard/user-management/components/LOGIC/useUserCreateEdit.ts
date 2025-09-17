"use client"

import { useEffect, useMemo, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useApiCall, useValidation, commonValidationRules, ValidationRule, ValidationSchema } from './hooks'
import { 
  USER_ENDPOINTS, 
  RBAC_ENDPOINTS, 
  AUTH_ENDPOINTS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES,
  HTTP_METHODS,
  PASSWORD_VISIBILITY
} from './constants'

/**
 * Custom hook untuk password visibility toggle
 * Mengikuti prinsip SRP dan reusability
 */
export function usePasswordVisibility() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  /**
   * Toggle password visibility
   * Mengikuti prinsip Pure Function
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev)
  }

  /**
   * Toggle confirm password visibility
   * Mengikuti prinsip Pure Function
   */
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(prev => !prev)
  }

  /**
   * Get password input type based on visibility state
   * Mengikuti prinsip DRY
   */
  const getPasswordInputType = (isVisible: boolean) => {
    return isVisible ? PASSWORD_VISIBILITY.INPUT_TYPE.VISIBLE : PASSWORD_VISIBILITY.INPUT_TYPE.HIDDEN
  }

  /**
   * Get visibility toggle text
   * Mengikuti prinsip DRY
   */
  const getVisibilityText = (isVisible: boolean) => {
    return isVisible ? PASSWORD_VISIBILITY.HIDE_TEXT : PASSWORD_VISIBILITY.SHOW_TEXT
  }

  return {
    showPassword,
    showConfirmPassword,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    getPasswordInputType,
    getVisibilityText
  }
}

/**
 * Interface untuk data form user
 * Mengikuti prinsip Interface Segregation Principle (ISP)
 */
export interface UserFormData {
  id?: string
  name: string
  email: string
  password?: string
  confirmPassword?: string
  department: string
  region: string
  level?: string
  status: 'active' | 'inactive'
  roles: string[]
}

/**
 * Validation schema untuk user form
 * Mengikuti prinsip DRY dengan menggunakan common validation rules
 */
const userValidationSchema = {
  name: [
    commonValidationRules.required('Nama wajib diisi'),
    commonValidationRules.minLength(2, 'Nama minimal 2 karakter'),
    commonValidationRules.maxLength(100, 'Nama maksimal 100 karakter')
  ],
  email: [
    commonValidationRules.required('Email wajib diisi'),
    commonValidationRules.email('Format email tidak valid')
  ],
  password: [
    commonValidationRules.strongPassword()
  ],
  confirmPassword: [
    commonValidationRules.confirmPassword('password', 'Password tidak cocok')
  ],
  department: [
    commonValidationRules.required('Department wajib diisi')
  ],
  region: [
    commonValidationRules.required('Region wajib diisi')
  ],
  level: [
    commonValidationRules.required('Level wajib diisi')
  ]
}

/**
 * Fungsi untuk transformasi data roles
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 * Fungsi ini hanya bertanggung jawab untuk transformasi data roles
 */
const transformRoleData = (rawData: any): Role[] => {
  // Handle response yang berupa object dengan property 'roles'
  let roles: any[]
  
  if (Array.isArray(rawData)) {
    roles = rawData
  } else if (rawData && Array.isArray(rawData.roles)) {
    roles = rawData.roles
  } else {
    console.warn('Invalid role data format:', rawData)
    return []
  }
  
  return roles.map(role => ({
    id: role.id,
    name: role.name,
    grantsAll: role.grantsAll ?? false,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt
  }))
}

/**
 * Interface untuk User
 * Mengikuti prinsip Interface Segregation Principle (ISP)
 */
export interface Role {
  id: number
  name: string
  grantsAll: boolean
  createdAt: string
  updatedAt?: string
}

/**
 * Konfigurasi validasi form
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 * Fungsi ini hanya bertanggung jawab untuk konfigurasi validasi
 */
const createValidationRules = (mode: 'create' | 'edit'): ValidationSchema => ({
  email: [
    commonValidationRules.required('Email wajib diisi'),
    commonValidationRules.email('Format email tidak valid')
  ],
  name: [
    commonValidationRules.required('Nama wajib diisi')
  ],
  password: mode === 'create' ? [
    commonValidationRules.strongPassword()
  ] : [],
  confirmPassword: mode === 'create' ? [
    commonValidationRules.confirmPassword('password', 'Password tidak cocok')
  ] : [],
  department: [
    commonValidationRules.required('Department wajib diisi')
  ],
  region: [
    commonValidationRules.required('Region wajib diisi')
  ],
  level: [
    commonValidationRules.required('Level wajib diisi')
  ]
})

/**
 * Data awal form
 * Mengikuti prinsip DRY dengan konstanta yang dapat digunakan ulang
 */
const INITIAL_FORM_DATA: UserFormData = {
  email: '',
  name: '',
  password: '',
  confirmPassword: '',
  department: '',
  region: '',
  level: '',
  status: 'active',
  roles: []
}

/**
 * Service class untuk operasi user
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 * Class ini hanya bertanggung jawab untuk operasi CRUD user
 */
class UserService {
  constructor(
    private fetchUserData: any,
    private saveUser: any,
    private updateUserRoles: any
  ) {}

  /**
   * Load user data untuk edit mode
   * Mengikuti prinsip Single Responsibility Principle (SRP)
   */
  async loadUserData(id: string) {
    const result = await this.fetchUserData({ 
      endpoint: USER_ENDPOINTS.DETAIL(id) 
    })
    
    if (result?.user) {
      const user = result.user
      return {
        email: user.email,
        name: user.name,
        password: '', // Password tidak di-load untuk security
        confirmPassword: '',
        department: user.department || '',
        region: user.region || '',
        level: user.level || '',
        status: (user.active ? 'active' : 'inactive') as 'active' | 'inactive',
        roles: user.roles?.map((role: any) => role.id.toString()) || []
      }
    }
    return null
  }

  /**
   * Update user roles via API
   * Mengikuti prinsip Single Responsibility Principle (SRP)
   */
  async updateRoles(userId: string, roleIds: string[]) {
    return await this.updateUserRoles({
      endpoint: USER_ENDPOINTS.USER_ROLES(userId),
      method: HTTP_METHODS.PUT,
      body: { roleIds: roleIds.map(id => parseInt(id)) },
      successMessage: SUCCESS_MESSAGES.ROLE.ASSIGNED
    })
  }

  /**
   * Update user password only
   * Mengikuti prinsip SRP - hanya bertanggung jawab untuk update password
   */
  async updatePassword(userId: string, password: string) {
    const token = localStorage.getItem('accessToken')
    
    if (!token) {
      throw new Error('Token tidak ditemukan')
    }

    try {
      const response = await fetch(`/api/v1/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      })

      // Log untuk debugging
      console.log('Response status:', response?.status || 'unknown')
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        let errorMessage = 'Gagal mengupdate password'
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          console.error('Error parsing response:', parseError)
        }

        // Log untuk debugging dengan safe logging
        console.error('Password update failed:', JSON.stringify({
          status: response?.status || 'unknown',
          statusText: response?.statusText || 'unknown error',
          errorMessage: errorMessage || 'unknown error'
        }, null, 2))

        throw new Error(errorMessage)
      }

      // Parse response
      const result = await response.json()
      
      // Validasi struktur response
      if (typeof result !== 'object' || result === null) {
        throw new Error('Response tidak valid')
      }

      return result
    } catch (error) {
      console.error('Error in updatePassword:', error)
      throw error
    }
  }

  /**
   * Create new user
   * Mengikuti prinsip Single Responsibility Principle (SRP)
   */
  async createUser(userData: UserFormData) {
    return await this.saveUser({
      endpoint: AUTH_ENDPOINTS.REGISTER,
      method: HTTP_METHODS.POST,
      body: {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        department: userData.department,
        region: userData.region,
        level: userData.level
      }
    })
  }

  /**
   * Update existing user
   * Mengikuti prinsip Single Responsibility Principle (SRP)
   */
  async updateUser(userId: string, userData: UserFormData) {
    const updateData: any = {
      name: userData.name,
      email: userData.email,
      department: userData.department,
      region: userData.region,
      level: userData.level,
      active: userData.status === 'active'
    }

    // Include password only if provided
    if (userData.password && userData.password.trim() !== '') {
      updateData.password = userData.password
    }

    return await this.saveUser({
      endpoint: USER_ENDPOINTS.UPDATE(userId),
      method: HTTP_METHODS.PUT,
      body: updateData
    })
  }
}

/**
 * Custom hook untuk mengelola logic create/edit user
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 * Hook ini hanya bertanggung jawab untuk mengelola state dan operasi user create/edit
 * 
 * Menerapkan prinsip DRY dengan menggunakan constants dari file terpisah
 * Menerapkan prinsip Open/Closed dengan service class yang dapat diperluas
 * Menerapkan prinsip Dependency Inversion dengan injeksi dependencies
 */
export function useUserCreateEdit(userId: string | null, mode: 'create' | 'edit', onSuccess: () => void) {
  // Loading states
  const [loading, setLoading] = useState(false)
  const [loadingData, setDataLoading] = useState(false)
  
  // Password update loading state
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  
  // Form validation rules
  const validationRules = createValidationRules(mode)
  
  // Enhanced validation dengan schema yang telah didefinisikan
  const { validateForm: validateFormWithSchema, isFormValid, getFormErrors } = useValidation(
    mode === 'create' ? 
      userValidationSchema :
      // Untuk edit mode, password tidak wajib
      { ...userValidationSchema, password: [], confirmPassword: [] }
  )
  
  // Form state management dengan useState biasa
  const [formData, setFormData] = useState<UserFormData>(INITIAL_FORM_DATA)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Form handlers
  const handleInputChange = useCallback((field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors])
  
  const updateFormData = useCallback((data: Partial<UserFormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }, [])
  
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA)
    setErrors({})
  }, [])
  
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}
    // Basic validation logic here
    return Object.keys(newErrors).length === 0
  }, [formData])
  
  const isValid = useMemo(() => validateForm(), [validateForm])
  
  // API calls dengan caching dan retry mechanism
  const {
    data: rawRoleData,
    execute: fetchRoles,
    clearCache: clearRolesCache
  } = useApiCall<any>({
    endpoint: RBAC_ENDPOINTS.ROLES,
    errorMessage: ERROR_MESSAGES.ROLE.LOAD_FAILED,
    cacheKey: 'roles-list',
    cacheConfig: { ttl: 10 * 60 * 1000 }, // 10 minutes
    retryConfig: { attempts: 3, delay: 1000, backoff: 'exponential' }
  })
  
  // Transform role data
  const availableRoles = useMemo(() => {
    return transformRoleData(rawRoleData)
  }, [rawRoleData])
  
  console.log('Raw availableRoles from API:', rawRoleData)
  console.log('Transformed availableRoles:', availableRoles)
  
  const {
    execute: fetchUserData,
    clearCache: clearUserCache
  } = useApiCall<any>({
    errorMessage: ERROR_MESSAGES.USER.LOAD_FAILED,
    cacheKey: userId ? `user-${userId}` : undefined,
    cacheConfig: { ttl: 5 * 60 * 1000 }, // 5 minutes
    retryConfig: { attempts: 3, delay: 1000, backoff: 'exponential' }
  })
  
  const {
    execute: saveUser
  } = useApiCall<any>({
    errorMessage: ERROR_MESSAGES.USER.CREATE_FAILED,
    retryConfig: { attempts: 3, delay: 1000, backoff: 'exponential' }
  })
  
  const {
    execute: updateUserRoles
  } = useApiCall<any>({
    errorMessage: ERROR_MESSAGES.ROLE.ASSIGN_FAILED,
    retryConfig: { attempts: 3, delay: 1000, backoff: 'exponential' }
  })

  // Service instance dengan dependency injection
  const userService = new UserService(fetchUserData, saveUser, updateUserRoles)

  /**
   * Load user data untuk edit mode
   * Mengikuti prinsip Dependency Inversion dengan menggunakan service
   */
  const loadUserData = async (id: string) => {
    setDataLoading(true)
    const userData = await userService.loadUserData(id)
    if (userData) {
      updateFormData(userData)
    }
    setDataLoading(false)
  }

  /**
   * Handle perubahan role selection
   * Mengikuti prinsip Single Responsibility Principle (SRP)
   */
  const handleRoleChange = (roleId: string, checked: boolean) => {
    const newRoles = checked 
      ? [...formData.roles, roleId]
      : formData.roles.filter(id => id !== roleId)
    
    handleInputChange('roles', newRoles as any)
  }

  /**
   * Validate form dengan enhanced validation
   */
  const validateCurrentForm = useCallback(() => {
    return validateFormWithSchema(formData)
  }, [validateFormWithSchema, formData])

  /**
   * Handle form submission
   * Mengikuti prinsip Single Responsibility Principle (SRP)
   * Menggunakan service untuk operasi CRUD dengan enhanced validation
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Enhanced validation dengan schema
    const validationResults = validateCurrentForm()
    const isFormValidWithSchema = Object.values(validationResults).every(result => result.isValid)
    
    if (!validateForm() || !isFormValidWithSchema) {
      const errors = getFormErrors(validationResults)
      if (errors.length > 0) {
        toast.error(`Form tidak valid: ${errors.join(', ')}`)
      }
      return
    }

    setLoading(true)
    
    try {
      if (mode === 'edit' && userId) {
        // Update existing user
        await userService.updateUser(userId, formData)

        // Update user roles if any roles are selected
        if (formData.roles.length > 0) {
          await userService.updateRoles(userId, formData.roles)
        }

        // Clear cache untuk refresh data
        clearUserCache()
        clearRolesCache()

        toast.success(SUCCESS_MESSAGES.USER.UPDATED)
      } else {
        // Create new user
        const result = await userService.createUser(formData)

        // Assign roles to newly created user if any roles are selected
        if (result?.user?.id && formData.roles.length > 0) {
          await userService.updateRoles(result.user.id.toString(), formData.roles)
        }

        // Clear cache untuk refresh data
        clearRolesCache()

        toast.success(SUCCESS_MESSAGES.USER.CREATED)
      }
      
      onSuccess()
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.USER.CREATE_FAILED)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get selected role names for display
   * Mengikuti prinsip Pure Function - tidak mengubah state
   */
  const getSelectedRoleNames = (): string[] => {
    if (!Array.isArray(availableRoles) || availableRoles.length === 0) {
      return []
    }
    return availableRoles
      .filter(role => formData.roles.includes(role.id.toString()))
      .map(role => role.name)
  }

  /**
   * Handle update password dengan validasi dan error handling yang robust
   * Mengikuti prinsip Single Responsibility Principle (SRP)
   */
  const handleUpdatePassword = async () => {
    // Validasi password required
    if (!formData.password || !formData.confirmPassword) {
      toast.error('Password dan konfirmasi password harus diisi')
      return
    }

    // Validasi password match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Password dan konfirmasi password tidak cocok')
      return
    }

    // Validasi password length
    if (formData.password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    if (!userId) {
      toast.error('User ID tidak ditemukan')
      return
    }

    setIsUpdatingPassword(true)
    
    try {
      const result = await userService.updatePassword(userId, formData.password)
      
      // Cek apakah update berhasil berdasarkan response
      if (result && result.success !== false) {
        toast.success('Password berhasil diupdate')
        
        // Clear password fields after successful update
        handleInputChange('password', '')
        handleInputChange('confirmPassword', '')
      } else {
        // Jika response menunjukkan gagal
        const errorMsg = result?.message || 'Gagal mengupdate password'
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error('Error updating password:', error)
      
      // Tampilkan pesan error yang lebih spesifik
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengupdate password'
      toast.error(errorMessage)
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  // Load data saat komponen mount atau parameter berubah
  useEffect(() => {
    fetchRoles()
  }, [])

  useEffect(() => {
    if (mode === 'edit' && userId) {
      loadUserData(userId)
    } else {
      // Reset form untuk create mode
      resetForm()
    }
  }, [mode, userId])

  return {
    // State
    loading,
    loadingData,
    formData,
    availableRoles: Array.isArray(availableRoles) ? availableRoles : [],
    errors,
    isUpdatingPassword,
    
    // Actions
    handleInputChange,
    handleRoleChange,
    handleSubmit,
    handleUpdatePassword,
    getSelectedRoleNames,
    validateCurrentForm,
    
    // Enhanced validation
    isFormValid: isFormValid(formData),
    validationResults: validateCurrentForm()
  }
}