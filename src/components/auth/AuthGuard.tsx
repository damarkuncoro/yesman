"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Props untuk AuthGuard component
 */
interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * AuthGuard Component
 * 
 * Komponen untuk melindungi halaman yang memerlukan autentikasi.
 * Jika user belum login, akan redirect ke halaman login.
 * 
 * Features:
 * - Automatic redirect ke login page jika belum authenticated
 * - Loading state saat checking authentication
 * - Customizable fallback component
 * - Customizable redirect URL
 * 
 * @param children - Komponen yang akan dirender jika user sudah login
 * @param fallback - Komponen loading/fallback saat checking auth
 * @param redirectTo - URL tujuan redirect (default: '/login')
 */
export function AuthGuard({ 
  children, 
  fallback, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  /**
   * Effect untuk handle redirect jika user belum login
   */
  useEffect(() => {
    // Jika masih loading, tunggu sampai selesai
    if (isLoading) return;
    
    // Jika tidak authenticated, redirect ke login
    if (!isAuthenticated) {
      console.log('🔒 User not authenticated, redirecting to login');
      router.push(redirectTo);
      return;
    }
    
    console.log('✅ User authenticated, allowing access to protected route');
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Tampilkan loading state saat checking authentication
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memeriksa status login...</p>
          </div>
        </div>
      )
    );
  }

  // Jika tidak authenticated, tampilkan loading (akan redirect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Mengarahkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  // Jika authenticated, render children
  return <>{children}</>;
}

/**
 * Higher-Order Component untuk wrapping page dengan AuthGuard
 * 
 * @param WrappedComponent - Component yang akan di-wrap
 * @param options - Options untuk AuthGuard
 * @returns Protected component
 */
export function withAuthGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<AuthGuardProps, 'children'>
) {
  const ProtectedComponent = (props: P) => {
    return (
      <AuthGuard {...options}>
        <WrappedComponent {...props} />
      </AuthGuard>
    );
  };

  // Set display name untuk debugging
  ProtectedComponent.displayName = `withAuthGuard(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ProtectedComponent;
}

/**
 * Hook untuk checking authentication status dengan redirect
 * Berguna untuk component yang perlu custom logic sebelum redirect
 * 
 * @param redirectTo - URL tujuan redirect
 * @returns Object dengan status authentication dan function redirect
 */
export function useAuthGuard(redirectTo: string = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  /**
   * Function untuk manual redirect ke login
   */
  const redirectToLogin = () => {
    console.log('🔒 Manual redirect to login triggered');
    router.push(redirectTo);
  };

  /**
   * Function untuk check dan redirect jika diperlukan
   * @returns boolean - true jika user authenticated, false jika tidak
   */
  const checkAndRedirect = () => {
    if (isLoading) return false;
    
    if (!isAuthenticated) {
      redirectToLogin();
      return false;
    }
    
    return true;
  };

  return {
    isAuthenticated,
    isLoading,
    redirectToLogin,
    checkAndRedirect
  };
}