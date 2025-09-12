/**
 * Context factory untuk membuat authorization context
 * Mengikuti prinsip Factory Pattern dan Dependency Inversion Principle (DIP)
 */

import { AuthorizationContext, ContextFactory } from '../types';
import { AuthenticatedUserContext } from '@/lib/authUtils';
import { authService } from '@/lib/auth/authService';
import { hasAnyRole, hasRole } from '@/lib/authUtils';

/**
 * Implementasi default context factory
 */
export class DefaultContextFactory implements ContextFactory {
  /**
   * Membuat authorization context dari authenticated user context
   * @param userContext - User context dari authentication
   * @returns Promise<AuthorizationContext> - Authorization context
   */
  async createAuthorizationContext(userContext: AuthenticatedUserContext): Promise<AuthorizationContext> {
    return {
      userId: userContext.user.id,
      email: userContext.user.email,
      roles: userContext.roles,

      /**
       * Cek permission menggunakan Hybrid RBAC + ABAC
       * @param featureName - Nama feature atau route path
       * @param action - Action yang diperlukan
       * @returns Promise<boolean> - true jika memiliki permission
       */
      hasPermission: async (featureName: string, action: 'create' | 'read' | 'update' | 'delete'): Promise<boolean> => {
        try {
          return await authService.checkPermission(
            userContext.user.id,
            featureName,
            action
          );
        } catch (error) {
          console.error('Error checking permission:', error);
          return false;
        }
      },

      /**
       * Cek apakah user memiliki salah satu dari role yang diperlukan
       * @param roleNames - Array nama role
       * @returns Promise<boolean> - true jika memiliki salah satu role
       */
      hasAnyRole: async (roleNames: string[]): Promise<boolean> => {
        return await authService.hasAnyRole(userContext.user.id, roleNames);
      },

      /**
       * Cek apakah user memiliki role tertentu
       * @param roleName - Nama role
       * @returns Promise<boolean> - true jika memiliki role
       */
      hasRole: async (roleName: string): Promise<boolean> => {
        return await authService.hasRole(userContext.user.id, roleName);
      }
    };
  }

  /**
   * Membuat context untuk public access (tanpa authentication)
   * @returns AuthorizationContext - Public context dengan akses terbatas
   */
  createPublicContext(): AuthorizationContext {
    return {
      userId: 0,
      email: '',
      roles: [],
      hasPermission: async () => false,
      hasAnyRole: async () => Promise.resolve(false),
      hasRole: async () => Promise.resolve(false),
    };
  }
}

/**
 * Factory function untuk membuat context factory
 * Memungkinkan dependency injection dan testing
 */
export function createContextFactory(): ContextFactory {
  return new DefaultContextFactory();
}

/**
 * Singleton instance untuk penggunaan default
 */
export const contextFactory = createContextFactory();