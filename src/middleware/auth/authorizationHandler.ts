/**
 * Authorization handler untuk middleware
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 */

import { NextResponse } from 'next/server';
import { 
  hasAnyRole,
  hasRole,
  type AuthenticatedUserContext
} from '@/lib/authUtils';
import { createErrorResponse } from '@/lib/auth/authService';
import { authService } from '@/lib/auth/authService';
import { routeFeatureRepository, featureRepository } from '@/repositories';
import { AuthorizationOptions } from '../types';

/**
 * Handler untuk proses authorization
 */
export class AuthorizationHandler {
  /**
   * Validasi role-based access
   * @param userContext - User context dari authentication
   * @param requiredRoles - Array role yang diperlukan
   * @returns boolean - true jika memiliki akses
   */
  async validateRoleAccess(userContext: AuthenticatedUserContext, requiredRoles: string[]): Promise<boolean> {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Tidak ada requirement role
    }

    return await authService.hasAnyRole(userContext.user.id, requiredRoles);
  }

  /**
   * Validasi feature-based access menggunakan Hybrid RBAC + ABAC
   * @param userContext - User context dari authentication
   * @param featureName - Nama feature
   * @param action - Action yang diperlukan
   * @returns Promise<boolean> - true jika memiliki akses
   */
  async validateFeatureAccess(
    userContext: AuthenticatedUserContext,
    featureName: string,
    action: 'create' | 'read' | 'update' | 'delete'
  ): Promise<boolean> {
    try {
      return await authService.checkPermission(
        userContext.user.id,
        featureName,
        action
      );
    } catch (error) {
      console.error('Error validating feature access:', error);
      return false;
    }
  }

  /**
   * Validasi route-based access menggunakan Hybrid RBAC + ABAC
   * @param userContext - User context dari authentication
   * @param routePath - Path route
   * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param action - Action yang diperlukan
   * @returns Promise<boolean> - true jika memiliki akses
   */
  async validateRouteAccess(
    userContext: AuthenticatedUserContext,
    routePath: string,
    method: string,
    action: 'create' | 'read' | 'update' | 'delete'
  ): Promise<boolean> {
    try {
      // Mapping route ke feature menggunakan routeFeatureRepository dengan pattern matching
      const matchingRoutes = await routeFeatureRepository.findMatchingRoutes(routePath, method);
      
      if (!matchingRoutes || matchingRoutes.length === 0) {
        console.warn(`⚠️ Route '${method} ${routePath}' tidak ditemukan dalam route_features`);
        return false;
      }

      // Ambil route feature pertama yang cocok
      const routeFeature = matchingRoutes[0];
      
      // Ambil feature berdasarkan featureId
      const feature = await featureRepository.findById(routeFeature.featureId);
      if (!feature) {
        console.warn(`⚠️ Feature dengan ID '${routeFeature.featureId}' tidak ditemukan`);
        return false;
      }

      console.log(`✅ Route '${method} ${routePath}' cocok dengan pattern '${routeFeature.method} ${routeFeature.path}' untuk feature '${feature.name}'`);

      // Gunakan feature name untuk checkPermission
      return await authService.checkPermission(
        userContext.user.id,
        feature.name,
        action
      );
    } catch (error) {
      console.error('Error validating route access:', error);
      return false;
    }
  }

  /**
   * Cek apakah user memiliki grants all permission (bypass semua cek)
   * @param userContext - User context dari authentication
   * @returns boolean - true jika memiliki grants all
   */
  hasGrantsAll(userContext: AuthenticatedUserContext): boolean {
    return userContext.hasGrantsAll || false;
  }

  /**
   * Validasi authorization berdasarkan options
   * @param userContext - User context dari authentication
   * @param options - Authorization options
   * @returns Promise<NextResponse | null> - Error response jika gagal, null jika berhasil
   */
  async validateAuthorization(
    userContext: AuthenticatedUserContext,
    options?: AuthorizationOptions
  ): Promise<NextResponse | null> {

    console.log('Authorization options:', options);
    console.log('User roles:', userContext.roles);
    console.log('User hasGrantsAll:', userContext.hasGrantsAll);
    console.log('Required roles:', options?.requiredRoles);
    console.log('Required feature:', options?.requiredFeature);
    console.log('Required action:', options?.requiredAction);

    // Bypass semua cek jika user memiliki grants all
    if (this.hasGrantsAll(userContext)) {
      console.log('✅ Grants all access granted');
      return null; // Berhasil
    }

    // Validasi role-based access
    if (options?.requiredRoles && options.requiredRoles.length > 0) {
      const hasRoleAccess = await this.validateRoleAccess(userContext, options.requiredRoles);
      if (!hasRoleAccess) {
        return NextResponse.json(
          createErrorResponse('Akses ditolak: Role tidak mencukupi', 403),
          { status: 403 }
        );
      }
    }

    // Validasi feature-based access
    if (options?.requiredFeature && options?.requiredAction) {
      const hasFeatureAccess = await this.validateFeatureAccess(
        userContext,
        options.requiredFeature,
        options.requiredAction
      );
      if (!hasFeatureAccess) {
        return NextResponse.json(
          createErrorResponse('Akses ditolak: RBAC atau ABAC validation gagal', 403),
          { status: 403 }
        );
      }
    }

    return null; // Berhasil
  }

  /**
   * Validasi route authorization dengan RBAC + ABAC
   * @param userContext - User context dari authentication
   * @param routePath - Path route yang akan divalidasi
   * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param action - Action yang diperlukan
   * @returns Promise<NextResponse | null> - Error response jika gagal, null jika berhasil
   */
  async validateRouteAuthorization(
    userContext: AuthenticatedUserContext,
    routePath: string,
    method: string,
    action: 'create' | 'read' | 'update' | 'delete'
  ): Promise<NextResponse | null> {
    // Bypass semua cek jika user memiliki grants all
    if (this.hasGrantsAll(userContext)) {
      return null; // Berhasil
    }

    const hasAccess = await this.validateRouteAccess(userContext, routePath, method, action);
    if (!hasAccess) {
      const errorResponse = createErrorResponse('Akses ditolak: RBAC atau ABAC validation gagal', 403);
      return NextResponse.json(errorResponse, { status: 403 });
    }

    return null; // Berhasil
  }
}

/**
 * Factory function untuk membuat authorization handler
 */
export function createAuthorizationHandler(): AuthorizationHandler {
  return new AuthorizationHandler();
}

/**
 * Singleton instance untuk penggunaan default
 */
export const authorizationHandler = createAuthorizationHandler();