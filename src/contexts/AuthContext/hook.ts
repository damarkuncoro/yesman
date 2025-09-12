import { useContext } from "react";
import { AuthContext } from './context';
import { AuthContextType } from './types';

/**
 * Custom hook untuk menggunakan AuthContext
 * Menyediakan type-safe access ke authentication state dan methods
 * 
 * @throws Error jika digunakan di luar AuthProvider
 * @returns AuthContextType object dengan state dan methods
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}