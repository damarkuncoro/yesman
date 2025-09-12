"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";

/**
 * Tipe untuk theme mode
 */
type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Interface untuk theme state
 */
interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  isLoading: boolean;
}

/**
 * Interface untuk theme context
 */
interface ThemeContextType extends ThemeState {
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

/**
 * Actions untuk theme reducer
 */
type ThemeAction = 
  | { type: 'SET_THEME'; payload: ThemeMode }
  | { type: 'SET_IS_DARK'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean };

/**
 * Initial state untuk theme
 */
const initialState: ThemeState = {
  mode: 'system',
  isDark: false,
  isLoading: true,
};

/**
 * Theme reducer untuk mengelola state theme
 */
function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'SET_THEME':
      return {
        ...state,
        mode: action.payload,
      };
    case 'SET_IS_DARK':
      return {
        ...state,
        isDark: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

/**
 * Create theme context
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Props untuk ThemeProvider
 */
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider Component
 * Mengelola state theme dan menyediakan methods untuk theme operations
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  /**
   * Function untuk mengecek system preference
   */
  const getSystemTheme = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  /**
   * Function untuk menentukan apakah theme dark berdasarkan mode
   */
  const calculateIsDark = (mode: ThemeMode): boolean => {
    switch (mode) {
      case 'dark':
        return true;
      case 'light':
        return false;
      case 'system':
        return getSystemTheme();
      default:
        return false;
    }
  };

  /**
   * Function untuk apply theme ke DOM
   */
  const applyTheme = (isDark: boolean) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  /**
   * Function untuk set theme mode
   */
  const setTheme = (mode: ThemeMode) => {
    dispatch({ type: 'SET_THEME', payload: mode });
    
    const isDark = calculateIsDark(mode);
    dispatch({ type: 'SET_IS_DARK', payload: isDark });
    applyTheme(isDark);
    
    // Simpan ke localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-mode', mode);
    }
  };

  /**
   * Function untuk toggle theme antara light dan dark
   */
  const toggleTheme = () => {
    const newMode = state.mode === 'dark' ? 'light' : 'dark';
    setTheme(newMode);
  };

  /**
   * Effect untuk initialize theme saat component mount
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Ambil theme dari localStorage atau gunakan system
    const savedTheme = localStorage.getItem('theme-mode') as ThemeMode;
    const initialMode = savedTheme || 'system';
    
    dispatch({ type: 'SET_THEME', payload: initialMode });
    
    const isDark = calculateIsDark(initialMode);
    dispatch({ type: 'SET_IS_DARK', payload: isDark });
    applyTheme(isDark);
    
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  /**
   * Effect untuk listen system theme changes
   */
  useEffect(() => {
    if (typeof window === 'undefined' || state.mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (state.mode === 'system') {
        dispatch({ type: 'SET_IS_DARK', payload: e.matches });
        applyTheme(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [state.mode]);

  /**
   * Context value yang akan di-provide
   */
  const contextValue: ThemeContextType = {
    ...state,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook untuk menggunakan theme context
 * @returns ThemeContextType - Theme context value
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}