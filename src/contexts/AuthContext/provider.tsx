"use client";

import React, { useReducer, useEffect, ReactNode } from "react";
import { publicApi, api } from "@/lib/apiClient";
import { AuthContext } from './context';
import { authReducer } from './reducer';
import { 
  AuthApiResponse, 
  UpdateProfileResponse, 
  initialAuthState,
  AuthUser 
} from './types';
import { 
  setLoadingAction, 
  loginSuccessAction, 
  logoutAction, 
  updateUserAction 
} from './actions';
import { RefreshTokenService } from '@/lib/auth/refreshTokenService';
import { TokenService } from '@/lib/auth/tokenService';

/**
 * Props untuk AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component yang menyediakan authentication context
 * ke seluruh aplikasi melalui React Context API
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  /**
   * Effect untuk check authentication status dan setup auto-refresh saat component mount
   * Mencoba restore session dari localStorage
   */
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (typeof window === 'undefined') return;
        
        const token = TokenService.getAccessToken();
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          const user = JSON.parse(userData) as AuthUser;
          
          // Cek apakah token masih valid
          if (!TokenService.isTokenExpired()) {
            dispatch(loginSuccessAction(user, token));
          } else {
            // Token expired, coba refresh
            try {
              const newToken = await RefreshTokenService.refreshToken();
              dispatch(loginSuccessAction(user, newToken));
            } catch {
              // Refresh gagal, clear tokens
              TokenService.clearTokens();
              localStorage.removeItem('user');
              dispatch(setLoadingAction(false));
            }
          }
        } else {
          dispatch(setLoadingAction(false));
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        TokenService.clearTokens();
        localStorage.removeItem('user');
        dispatch(setLoadingAction(false));
      }
    };

    checkAuthStatus();
  }, []);

  /**
   * Setup auto-refresh dan event listeners
   */
  useEffect(() => {
    let clearAutoRefresh: (() => void) | null = null;
    
    // Setup auto-refresh jika user sudah login
     if (state.user && state.accessToken) {
       clearAutoRefresh = RefreshTokenService.setupAutoRefresh(5); // Check setiap 5 menit
     }

    // Listen untuk token refresh failed event
    const handleTokenRefreshFailed = () => {
      console.log('🔄 Token refresh failed, logging out user');
      dispatch(logoutAction());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:token-refresh-failed', handleTokenRefreshFailed);
    }

    return () => {
      if (clearAutoRefresh) {
        clearAutoRefresh();
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:token-refresh-failed', handleTokenRefreshFailed);
      }
    };
  }, [state.user, state.accessToken]);

  /**
   * Function untuk melakukan login
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      dispatch(setLoadingAction(true));
      
      const response = await publicApi.post('/auth/login', { email, password }) as AuthApiResponse;
      
      if (!response.success) {
        throw new Error(response.message || 'Login gagal');
      }
      
      const { user, accessToken, refreshToken } = response.data;
      
      // Simpan tokens menggunakan TokenService
       const expiresAt = TokenService.getTokenExpiration(accessToken);
       TokenService.setTokens({
         accessToken,
         refreshToken,
         expiresAt: expiresAt || undefined
       });
      
      dispatch(loginSuccessAction(user, accessToken));
    } catch (error) {
      dispatch(setLoadingAction(false));
      throw error;
    }
  };

  /**
   * Function untuk melakukan registrasi
   */
  const register = async (name: string, email: string, password: string): Promise<void> => {
    try {
      dispatch(setLoadingAction(true));
      
      const response = await publicApi.post('/auth/register', { name, email, password }) as AuthApiResponse;
      
      if (!response.success) {
        throw new Error(response.message || 'Registrasi gagal');
      }
      
      dispatch(loginSuccessAction(response.data.user, response.data.accessToken));
    } catch (error) {
      dispatch(setLoadingAction(false));
      throw error;
    }
  };

  /**
   * Function untuk melakukan logout
   */
  const logout = async (): Promise<void> => {
    try {
      dispatch(setLoadingAction(true));
      
      // Call logout API untuk invalidate refresh token
      await api.post('/auth/logout');
      
      // Clear tokens menggunakan TokenService
      TokenService.clearTokens();
      dispatch(logoutAction());
    } catch (error) {
      // Tetap logout meskipun API call gagal
      TokenService.clearTokens();
      dispatch(logoutAction());
      console.error('Logout error:', error);
    }
  };

  /**
   * Function untuk update profile user
   */
  const updateProfile = async (data: { name?: string; email?: string }): Promise<void> => {
    try {
      dispatch(setLoadingAction(true));
      
      const response = await api.put('/auth/profile', data) as UpdateProfileResponse;
      
      if (!response.success) {
        throw new Error(response.message || 'Update profile gagal');
      }
      
      dispatch(updateUserAction(response.data.user));
    } catch (error) {
      dispatch(setLoadingAction(false));
      throw error;
    }
  };

  /**
   * Function untuk refresh access token
   */
  const refreshToken = async (): Promise<void> => {
    try {
      const newAccessToken = await RefreshTokenService.refreshToken();
      
      // Update state dengan token baru
      if (state.user) {
        dispatch(loginSuccessAction(state.user, newAccessToken));
      }
    } catch (error) {
      console.error('Refresh token error:', error);
      
      // Clear tokens dan logout
      TokenService.clearTokens();
      dispatch(logoutAction());
      throw error;
    }
  };

  const contextValue = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}