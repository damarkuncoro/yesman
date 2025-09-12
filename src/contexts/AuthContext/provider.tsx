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
   * Effect untuk check authentication status saat component mount
   * Mencoba restore session dari localStorage
   */
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (typeof window === 'undefined') return;
        
        const token = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          const user = JSON.parse(userData) as AuthUser;
          dispatch(loginSuccessAction(user, token));
        } else {
          dispatch(setLoadingAction(false));
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        dispatch(setLoadingAction(false));
      }
    };

    checkAuthStatus();
  }, []);

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
      
      dispatch(loginSuccessAction(response.data.user, response.data.accessToken));
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
      
      dispatch(logoutAction());
    } catch (error) {
      // Tetap logout meskipun API call gagal
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
      const response = await publicApi.post('/auth/refresh') as AuthApiResponse;
      
      if (!response.success) {
        throw new Error('Token refresh gagal');
      }
      
      dispatch(loginSuccessAction(response.data.user, response.data.accessToken));
    } catch (error) {
      // Jika refresh gagal, logout user
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