import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect } from 'react'

/**
 * Interface untuk konfigurasi redirect
 */
export interface RedirectConfig {
  successUrl?: string
  failureUrl?: string
  loginUrl?: string
  defaultUrl?: string
}

/**
 * Custom hook untuk mengelola redirect dan navigation dalam authentication flow
 * Mengikuti prinsip SRP untuk menangani routing logic secara terpisah
 * 
 * @param config - Konfigurasi URL untuk berbagai skenario redirect
 * @returns Object berisi methods untuk mengelola redirect
 */
export const useAuthRedirect = (config: RedirectConfig = {}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const {
    successUrl = '/dashboard',
    failureUrl = '/login',
    loginUrl = '/login',
    defaultUrl = '/'
  } = config

  /**
   * Method untuk mendapatkan URL redirect dari query parameter
   * @returns URL redirect atau null jika tidak ada
   */
  const getRedirectUrl = useCallback((): string | null => {
    return searchParams.get('redirect') || searchParams.get('callbackUrl')
  }, [searchParams])

  /**
   * Method untuk redirect setelah login berhasil
   * Akan menggunakan URL dari query parameter jika ada, atau successUrl sebagai fallback
   */
  const redirectAfterLogin = useCallback(() => {
    const redirectUrl = getRedirectUrl()
    const targetUrl = redirectUrl || successUrl
    
    // Validasi URL untuk mencegah open redirect vulnerability
    if (redirectUrl && !isValidRedirectUrl(redirectUrl)) {
      console.warn('Invalid redirect URL detected, using default success URL')
      router.push(successUrl)
      return
    }
    
    router.push(targetUrl)
  }, [router, successUrl, getRedirectUrl])

  /**
   * Method untuk redirect setelah logout
   * @param customUrl - URL custom untuk redirect (opsional)
   */
  const redirectAfterLogout = useCallback((customUrl?: string) => {
    const targetUrl = customUrl || loginUrl
    router.push(targetUrl)
  }, [router, loginUrl])

  /**
   * Method untuk redirect setelah registrasi berhasil
   * @param customUrl - URL custom untuk redirect (opsional)
   */
  const redirectAfterRegister = useCallback((customUrl?: string) => {
    const targetUrl = customUrl || successUrl
    router.push(targetUrl)
  }, [router, successUrl])

  /**
   * Method untuk redirect setelah authentication gagal
   * @param customUrl - URL custom untuk redirect (opsional)
   */
  const redirectAfterFailure = useCallback((customUrl?: string) => {
    const targetUrl = customUrl || failureUrl
    router.push(targetUrl)
  }, [router, failureUrl])

  /**
   * Method untuk redirect ke halaman sebelumnya atau default
   */
  const redirectToPrevious = useCallback(() => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(defaultUrl)
    }
  }, [router, defaultUrl])

  /**
   * Method untuk membuat URL login dengan redirect parameter
   * @param currentUrl - URL saat ini yang akan dijadikan redirect target
   * @returns URL login dengan parameter redirect
   */
  const createLoginUrlWithRedirect = useCallback((currentUrl?: string) => {
    const redirectTarget = currentUrl || window.location.pathname
    const loginUrlWithRedirect = new URL(loginUrl, window.location.origin)
    loginUrlWithRedirect.searchParams.set('redirect', redirectTarget)
    return loginUrlWithRedirect.toString()
  }, [loginUrl])

  /**
   * Method untuk redirect ke login dengan menyimpan current URL
   */
  const redirectToLogin = useCallback(() => {
    const currentPath = window.location.pathname
    const loginUrlWithRedirect = createLoginUrlWithRedirect(currentPath)
    router.push(loginUrlWithRedirect)
  }, [router, createLoginUrlWithRedirect])

  /**
   * Method untuk replace current URL (tidak menambah history)
   * @param url - URL tujuan
   */
  const replaceUrl = useCallback((url: string) => {
    router.replace(url)
  }, [router])

  /**
   * Effect untuk auto-redirect berdasarkan kondisi tertentu
   * @param shouldRedirect - Kondisi apakah harus redirect
   * @param targetUrl - URL tujuan redirect
   * @param delay - Delay sebelum redirect (dalam ms)
   */
  const useAutoRedirect = useCallback((shouldRedirect: boolean, targetUrl: string, delay: number = 0) => {
    useEffect(() => {
      if (shouldRedirect) {
        const timeoutId = setTimeout(() => {
          router.push(targetUrl)
        }, delay)
        
        return () => clearTimeout(timeoutId)
      }
    }, [shouldRedirect, targetUrl, delay, router])
  }, [router])

  return {
    getRedirectUrl,
    redirectAfterLogin,
    redirectAfterLogout,
    redirectAfterRegister,
    redirectAfterFailure,
    redirectToPrevious,
    redirectToLogin,
    createLoginUrlWithRedirect,
    replaceUrl,
    useAutoRedirect
  }
}

/**
 * Helper function untuk memvalidasi URL redirect
 * Mencegah open redirect vulnerability
 * @param url - URL yang akan divalidasi
 * @returns true jika URL valid dan aman
 */
function isValidRedirectUrl(url: string): boolean {
  try {
    // Hanya izinkan relative URL atau URL dengan same origin
    if (url.startsWith('/')) {
      return true
    }
    
    const urlObj = new URL(url)
    return urlObj.origin === window.location.origin
  } catch {
    return false
  }
}

export default useAuthRedirect