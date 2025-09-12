import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Interface untuk data user session
 */
export interface UserSession {
  id: string
  email: string
  name: string
  role?: string
  permissions?: string[]
  department?: string
  region?: string
  level?: string
}

/**
 * Interface untuk token data
 */
export interface TokenData {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  tokenType?: string
}

/**
 * Interface untuk session state
 */
export interface SessionState {
  user: UserSession | null
  token: TokenData | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

/**
 * Interface untuk konfigurasi session
 */
export interface SessionConfig {
  autoRefresh?: boolean
  refreshThreshold?: number // dalam menit sebelum token expire
  storageKey?: string
  onSessionExpired?: () => void
  onRefreshFailed?: (error: Error) => void
}

/**
 * Custom hook untuk mengelola authentication session dan token management
 * Mengikuti prinsip SRP untuk menangani session logic secara terpisah
 * 
 * @param config - Konfigurasi untuk session management
 * @returns Object berisi state dan methods untuk mengelola session
 */
export const useAuthSession = (config: SessionConfig = {}) => {
  const {
    autoRefresh = true,
    refreshThreshold = 5, // 5 menit sebelum expire
    storageKey = 'auth_session',
    onSessionExpired,
    onRefreshFailed
  } = config

  const router = useRouter()
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [sessionState, setSessionState] = useState<SessionState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  })

  /**
   * Method untuk menyimpan session ke localStorage
   * @param session - Data session yang akan disimpan
   */
  const saveSessionToStorage = useCallback((session: { user: UserSession; token: TokenData }) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(session))
    } catch (error) {
      console.error('Failed to save session to storage:', error)
    }
  }, [storageKey])

  /**
   * Method untuk memuat session dari localStorage
   * @returns Session data atau null jika tidak ada
   */
  const loadSessionFromStorage = useCallback((): { user: UserSession; token: TokenData } | null => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) return null
      
      const session = JSON.parse(stored)
      
      // Validasi struktur data
      if (!session.user || !session.token) return null
      
      // Cek apakah token sudah expired
      if (session.token.expiresAt && Date.now() >= session.token.expiresAt) {
        localStorage.removeItem(storageKey)
        return null
      }
      
      return session
    } catch (error) {
      console.error('Failed to load session from storage:', error)
      localStorage.removeItem(storageKey)
      return null
    }
  }, [storageKey])

  /**
   * Method untuk menghapus session dari storage
   */
  const clearSessionFromStorage = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Failed to clear session from storage:', error)
    }
  }, [storageKey])

  /**
   * Method untuk mengatur session baru
   * @param user - Data user
   * @param token - Data token
   */
  const setSession = useCallback((user: UserSession, token: TokenData) => {
    const newSession = { user, token }
    
    setSessionState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      error: null
    })
    
    saveSessionToStorage(newSession)
    
    // Setup auto refresh jika diaktifkan
    if (autoRefresh && token.expiresAt) {
      scheduleTokenRefresh(token.expiresAt)
    }
  }, [saveSessionToStorage, autoRefresh])

  /**
   * Method untuk menghapus session (logout)
   */
  const clearSession = useCallback(() => {
    setSessionState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    })
    
    clearSessionFromStorage()
    
    // Clear refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }
  }, [clearSessionFromStorage])

  /**
   * Method untuk refresh token
   * @returns Promise yang resolve dengan token baru atau reject jika gagal
   */
  const refreshToken = useCallback(async (): Promise<TokenData> => {
    try {
      const currentToken = sessionState.token
      if (!currentToken?.refreshToken) {
        throw new Error('No refresh token available')
      }

      // Call API untuk refresh token
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: currentToken.refreshToken
        })
      })

      if (!response.ok) {
        throw new Error('Failed to refresh token')
      }

      const newTokenData = await response.json()
      
      // Update session dengan token baru
      if (sessionState.user) {
        setSession(sessionState.user, newTokenData)
      }
      
      return newTokenData
    } catch (error) {
      console.error('Token refresh failed:', error)
      
      // Panggil callback jika refresh gagal
      if (onRefreshFailed) {
        onRefreshFailed(error as Error)
      }
      
      // Clear session jika refresh gagal
      clearSession()
      
      throw error
    }
  }, [sessionState.token, sessionState.user, setSession, clearSession, onRefreshFailed])

  /**
   * Method untuk menjadwalkan refresh token otomatis
   * @param expiresAt - Timestamp kapan token expire
   */
  const scheduleTokenRefresh = useCallback((expiresAt: number) => {
    // Clear timeout sebelumnya jika ada
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    
    const now = Date.now()
    const refreshTime = expiresAt - (refreshThreshold * 60 * 1000) // Convert menit ke ms
    const delay = refreshTime - now
    
    if (delay > 0) {
      refreshTimeoutRef.current = setTimeout(() => {
        refreshToken().catch(() => {
          // Error sudah dihandle di refreshToken method
        })
      }, delay)
    }
  }, [refreshThreshold, refreshToken])

  /**
   * Method untuk mengecek apakah token akan segera expire
   * @returns true jika token akan expire dalam threshold time
   */
  const isTokenExpiringSoon = useCallback((): boolean => {
    if (!sessionState.token?.expiresAt) return false
    
    const now = Date.now()
    const thresholdTime = refreshThreshold * 60 * 1000
    
    return (sessionState.token.expiresAt - now) <= thresholdTime
  }, [sessionState.token, refreshThreshold])

  /**
   * Method untuk mengecek apakah user memiliki permission tertentu
   * @param permission - Permission yang dicek
   * @returns true jika user memiliki permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    return sessionState.user?.permissions?.includes(permission) || false
  }, [sessionState.user])

  /**
   * Method untuk mengecek apakah user memiliki role tertentu
   * @param role - Role yang dicek
   * @returns true jika user memiliki role
   */
  const hasRole = useCallback((role: string): boolean => {
    return sessionState.user?.role === role
  }, [sessionState.user])

  /**
   * Effect untuk memuat session saat component mount
   */
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedSession = loadSessionFromStorage()
        
        if (storedSession) {
          setSessionState({
            user: storedSession.user,
            token: storedSession.token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
          // Setup auto refresh
          if (autoRefresh && storedSession.token.expiresAt) {
            scheduleTokenRefresh(storedSession.token.expiresAt)
          }
        } else {
          setSessionState(prev => ({ ...prev, isLoading: false }))
        }
      } catch (error) {
        console.error('Failed to load session:', error)
        setSessionState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to load session'
        })
      }
    }
    
    loadSession()
  }, [loadSessionFromStorage, autoRefresh, scheduleTokenRefresh])

  /**
   * Cleanup effect
   */
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  return {
    ...sessionState,
    setSession,
    clearSession,
    refreshToken,
    isTokenExpiringSoon,
    hasPermission,
    hasRole
  }
}

export default useAuthSession