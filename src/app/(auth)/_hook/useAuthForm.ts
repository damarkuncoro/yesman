import { useState, useCallback } from 'react'

/**
 * Interface untuk state form authentication
 */
export interface AuthFormState {
  isLoading: boolean
  error: string | null
  success: boolean
}

/**
 * Interface untuk data form login
 */
export interface LoginFormData {
  email: string
  password: string
}

/**
 * Interface untuk data form register
 */
export interface RegisterFormData {
  name: string
  email: string
  password: string
}

/**
 * Interface untuk data form forgot password
 */
export interface ForgotPasswordFormData {
  email: string
}

/**
 * Interface untuk data form reset password
 */
export interface ResetPasswordFormData {
  password: string
  confirmPassword: string
}

/**
 * Custom hook untuk mengelola state dan lifecycle form authentication
 * Mengikuti prinsip SRP (Single Responsibility Principle) dan DRY
 * 
 * @returns Object berisi state dan methods untuk mengelola form authentication
 */
export const useAuthForm = () => {
  const [state, setState] = useState<AuthFormState>({
    isLoading: false,
    error: null,
    success: false
  })

  /**
   * Method untuk mengatur state loading
   * @param loading - Status loading
   */
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading, error: null }))
  }, [])

  /**
   * Method untuk mengatur state error
   * @param error - Pesan error
   */
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false, success: false }))
  }, [])

  /**
   * Method untuk mengatur state success
   * @param success - Status success
   */
  const setSuccess = useCallback((success: boolean) => {
    setState(prev => ({ ...prev, success, error: null, isLoading: false }))
  }, [])

  /**
   * Method untuk mereset state ke kondisi awal
   */
  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      success: false
    })
  }, [])

  /**
   * Method untuk menangani submit form dengan error handling
   * @param submitFn - Function yang akan dijalankan saat submit
   */
  const handleSubmit = useCallback(async (submitFn: () => Promise<void>) => {
    try {
      setLoading(true)
      await submitFn()
      setSuccess(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan'
      setError(errorMessage)
    }
  }, [setLoading, setSuccess, setError])

  return {
    ...state,
    setLoading,
    setError,
    setSuccess,
    resetState,
    handleSubmit
  }
}

export default useAuthForm