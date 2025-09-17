/**
 * API Constants untuk User Management
 * Mengikuti prinsip DRY (Don't Repeat Yourself) dan Single Source of Truth
 * Semua URL API dikumpulkan di satu tempat untuk memudahkan maintenance
 */

// Base API paths
export const API_BASE = {
  USERS: '/users',
  RBAC: '/rbac',
  AUTH: '/v1/auth'
} as const

// User Management Endpoints
export const USER_ENDPOINTS = {
  // User CRUD operations
  LIST: API_BASE.USERS,
  DETAIL: (id: string) => `${API_BASE.USERS}/${id}`,
  CREATE: API_BASE.USERS,
  UPDATE: (id: string) => `${API_BASE.USERS}/${id}`,
  DELETE: (id: string) => `${API_BASE.USERS}/${id}`,
  
  // User profile
  PROFILE: `${API_BASE.USERS}/profile`,
  
  // User permissions and roles
  USER_PERMISSIONS: (id: string) => `${API_BASE.USERS}/${id}/permissions`,
  USER_ROLES: (id: string) => `${API_BASE.USERS}/${id}/roles`
} as const

// RBAC (Role-Based Access Control) Endpoints
export const RBAC_ENDPOINTS = {
  // Roles management
  ROLES: `${API_BASE.RBAC}/roles`,
  ROLE_DETAIL: (id: string) => `${API_BASE.RBAC}/roles/${id}`,
  
  // User-Role assignments
  USER_ROLES: `${API_BASE.RBAC}/user-roles`,
  ASSIGN_ROLE: `${API_BASE.RBAC}/user-roles`,
  REVOKE_ROLE: `${API_BASE.RBAC}/user-roles`,
  
  // Role-Feature assignments
  ROLE_FEATURES: `${API_BASE.RBAC}/role-features`,
  
  // Route-Feature assignments
  ROUTE_FEATURES: `${API_BASE.RBAC}/route-features`
} as const

// Authentication Endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE.AUTH}/login`,
  REGISTER: `${API_BASE.AUTH}/register`,
  REFRESH: `${API_BASE.AUTH}/refresh`,
  LOGOUT: `${API_BASE.AUTH}/logout`,
  FORGOT_PASSWORD: `${API_BASE.AUTH}/forgot-password`,
  RESET_PASSWORD: `${API_BASE.AUTH}/reset-password`
} as const

// HTTP Methods Constants
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH'
} as const

// Error Messages Constants
export const ERROR_MESSAGES = {
  USER: {
    LOAD_FAILED: 'Gagal memuat data pengguna',
    CREATE_FAILED: 'Gagal membuat pengguna baru',
    UPDATE_FAILED: 'Gagal memperbarui data pengguna',
    DELETE_FAILED: 'Gagal menghapus pengguna'
  },
  ROLE: {
    LOAD_FAILED: 'Gagal memuat data roles',
    ASSIGN_FAILED: 'Gagal menugaskan role ke pengguna',
    REVOKE_FAILED: 'Gagal mencabut role dari pengguna'
  },
  GENERAL: {
    NETWORK_ERROR: 'Terjadi kesalahan jaringan',
    UNAUTHORIZED: 'Anda tidak memiliki akses',
    SERVER_ERROR: 'Terjadi kesalahan server'
  }
} as const

// Success Messages Constants
export const SUCCESS_MESSAGES = {
  USER: {
    CREATED: 'Pengguna berhasil dibuat',
    UPDATED: 'Data pengguna berhasil diperbarui',
    DELETED: 'Pengguna berhasil dihapus'
  },
  ROLE: {
    ASSIGNED: 'Role berhasil ditugaskan',
    REVOKED: 'Role berhasil dicabut'
  }
} as const

/**
 * UI Constants untuk Password Visibility
 * Mengikuti prinsip DRY untuk reusable UI elements
 */
export const PASSWORD_VISIBILITY = {
  SHOW_TEXT: 'Tampilkan password',
  HIDE_TEXT: 'Sembunyikan password',
  INPUT_TYPE: {
    VISIBLE: 'text',
    HIDDEN: 'password'
  }
} as const

// Search Configuration Constants
export const SEARCH_CONFIG = {
  USER_SEARCH_KEYS: ['name', 'email', 'department', 'region', 'level'] as (keyof import('./useUserList').User)[],
  ROLE_SEARCH_KEYS: ['name'] as (keyof import('./useUserRoleAssignment').Role)[]
} as const

// Type definitions untuk type safety
export type ApiEndpoint = typeof USER_ENDPOINTS[keyof typeof USER_ENDPOINTS] | 
                         typeof RBAC_ENDPOINTS[keyof typeof RBAC_ENDPOINTS] |
                         typeof AUTH_ENDPOINTS[keyof typeof AUTH_ENDPOINTS]

export type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS]