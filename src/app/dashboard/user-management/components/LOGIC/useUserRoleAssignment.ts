"use client"

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useApiCall } from './hooks'
import { 
  USER_ENDPOINTS, 
  RBAC_ENDPOINTS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES,
  HTTP_METHODS 
} from './constants'

/**
 * Interface untuk User
 * Mengikuti prinsip Interface Segregation Principle (ISP)
 */
export interface User {
  id: number
  email: string
  name: string
  department: string | null
  region: string | null
  active: boolean
}

/**
 * Interface untuk Role
 * Mengikuti prinsip Interface Segregation Principle (ISP)
 */
export interface Role {
  id: number
  name: string
  grantsAll: boolean
  createdAt: string
  updatedAt?: string
}

/**
 * Interface untuk UserRole
 * Mengikuti prinsip Interface Segregation Principle (ISP)
 */
export interface UserRole {
  id: number
  userId: number
  roleId: number
  role: Role
}

/**
 * Service class untuk operasi user role assignment
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 * Class ini hanya bertanggung jawab untuk operasi assignment role
 */
class UserRoleService {
  constructor(
    private assignRoleToUser: any,
    private revokeRoleFromUser: any,
    private loadUserRoles: any
  ) {}

  /**
   * Assign role ke user
   * Mengikuti prinsip Single Responsibility Principle (SRP)
   */
  async assignRole(userId: number, roleId: number, expiryDate?: string) {
    return await this.assignRoleToUser({
      body: {
        userId,
        roleId,
        expiresAt: expiryDate || null
      }
    })
  }

  /**
   * Revoke role dari user
   * Mengikuti prinsip Single Responsibility Principle (SRP)
   */
  async revokeRole(userId: number, roleId: number) {
    return await this.revokeRoleFromUser({
      body: {
        userId,
        roleId
      }
    })
  }

  /**
   * Load user roles untuk user tertentu
   * Mengikuti prinsip Single Responsibility Principle (SRP)
   */
  async fetchUserRoles(userId: number) {
    return await this.loadUserRoles({ 
      endpoint: RBAC_ENDPOINTS.USER_ROLES + `/${userId}` 
    })
  }
}

/**
 * Utility class untuk operasi data
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 * Class ini hanya bertanggung jawab untuk operasi utilitas data
 */
class DataUtility {
  /**
   * Filter users berdasarkan search term
   * Mengikuti prinsip Single Responsibility Principle (SRP)
   */
  static filterUsers(users: User[], searchTerm: string): User[] {
    if (!Array.isArray(users) || users.length === 0) {
      return []
    }
    
    return users.filter(user => {
      if (!user || !user.name || !user.email) {
        return false
      }
      
      const matchesSearch = searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch && user.active === true
    })
  }

  /**
   * Get role name by role ID
   * Mengikuti prinsip Single Responsibility Principle (SRP)
   */
  static getRoleName(roles: Role[], roleId: number): string {
    const role = Array.isArray(roles) ? roles.find(r => r.id === roleId) : undefined
    return role?.name || 'Unknown Role'
  }

  /**
   * Get user name by user ID
   * Mengikuti prinsip Single Responsibility Principle (SRP)
   */
  static getUserName(users: User[], userId: number): string {
    const user = Array.isArray(users) ? users.find(u => u.id === userId) : undefined
    return user?.name || 'Unknown User'
  }

  /**
   * Get available roles untuk assignment (yang belum di-assign)
   * Mengikuti prinsip Single Responsibility Principle (SRP)
   */
  static getAvailableRoles(roles: Role[], userRoles: UserRole[]): Role[] {
    if (!Array.isArray(roles) || !Array.isArray(userRoles)) return []
    const assignedRoleIds = userRoles
      .filter(ur => ur.role)
      .map(ur => ur.roleId)
    return roles.filter(role => !assignedRoleIds.includes(role.id))
  }

  /**
   * Format date untuk display
   * Mengikuti prinsip Single Responsibility Principle (SRP)
   */
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

/**
 * Custom hook untuk mengelola logic user role assignment
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 * Hook ini hanya bertanggung jawab untuk mengelola state dan operasi user role assignment
 * 
 * Menerapkan prinsip DRY dengan menggunakan constants dari file terpisah
 * Menerapkan prinsip Open/Closed dengan service class yang dapat diperluas
 * Menerapkan prinsip Dependency Inversion dengan injeksi dependencies
 */
export function useUserRoleAssignment(selectedUserId?: string) {
  // Loading states
  // Loading states
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  
  // Local state
  const [selectedUser, setSelectedUser] = useState<string>(selectedUserId || '')
  const [searchTerm, setSearchTerm] = useState('')
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  
  // API calls untuk data fetching
  const {
    data: users,
    execute: loadUsers
  } = useApiCall<User[]>({
    endpoint: USER_ENDPOINTS.LIST,
    errorMessage: ERROR_MESSAGES.USER.LOAD_FAILED
  })
  
  const {
    data: roles,
    execute: loadRoles
  } = useApiCall<Role[]>({
    endpoint: RBAC_ENDPOINTS.ROLES,
    errorMessage: ERROR_MESSAGES.ROLE.LOAD_FAILED
  })
  
  const {
    data: userRoles,
    execute: loadUserRoles
  } = useApiCall<UserRole[]>({
    errorMessage: ERROR_MESSAGES.ROLE.LOAD_FAILED
  })
  
  // API calls untuk operations
  const {
    execute: assignRoleToUser
  } = useApiCall<any>({
    endpoint: RBAC_ENDPOINTS.USER_ROLES,
    method: HTTP_METHODS.POST,
    errorMessage: ERROR_MESSAGES.ROLE.ASSIGN_FAILED
  })
  
  const {
    execute: revokeRoleFromUser
  } = useApiCall<any>({
    endpoint: RBAC_ENDPOINTS.USER_ROLES,
    method: HTTP_METHODS.DELETE,
    errorMessage: ERROR_MESSAGES.ROLE.REVOKE_FAILED
  })

  // Service instance dengan dependency injection
  const userRoleService = new UserRoleService(assignRoleToUser, revokeRoleFromUser, loadUserRoles)

  /**
   * Filter users berdasarkan search term
   * Menggunakan utility class untuk operasi data
   */
  const filteredUsers = useMemo(() => {
    return DataUtility.filterUsers(users || [], searchTerm)
  }, [users, searchTerm])

  /**
   * Get role name by role ID
   * Menggunakan utility class untuk operasi data
   */
  const getRoleName = (roleId: number) => {
    return DataUtility.getRoleName(roles || [], roleId)
  }

  /**
   * Get user name by user ID
   * Menggunakan utility class untuk operasi data
   */
  const getUserName = (userId: number) => {
    return DataUtility.getUserName(users || [], userId)
  }

  /**
   * Get available roles untuk assignment (yang belum di-assign)
   * Menggunakan utility class untuk operasi data
   */
  const getAvailableRoles = () => {
    return DataUtility.getAvailableRoles(roles || [], userRoles || [])
  }

  /**
   * Handle assign role ke user
   * Menggunakan service untuk operasi assignment
   */
  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error('Please select both user and role')
      return
    }

    setLoading(true)
    
    try {
      await userRoleService.assignRole(
        parseInt(selectedUser),
        parseInt(selectedRole),
        expiryDate
      )
      
      await userRoleService.fetchUserRoles(parseInt(selectedUser))
      setAssignDialogOpen(false)
      setSelectedRole('')
      setExpiryDate('')
      
      toast.success(SUCCESS_MESSAGES.ROLE.ASSIGNED)
    } catch (error) {
      console.error('Error assigning role:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle revoke role dari user
   * Menggunakan service untuk operasi revoke
   */
  const handleRevokeRole = async (userRoleId: number, roleId: number) => {
    setLoading(true)
    
    try {
      await userRoleService.revokeRole(
        parseInt(selectedUser),
        roleId
      )
      
      await userRoleService.fetchUserRoles(parseInt(selectedUser))
      toast.success(SUCCESS_MESSAGES.ROLE.REVOKED)
    } catch (error) {
      console.error('Error revoking role:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Format date untuk display
   * Menggunakan utility class untuk operasi data
   */
  const formatDate = (dateString: string) => {
    return DataUtility.formatDate(dateString)
  }

  /**
   * Refresh all data
   * Mengikuti prinsip Single Responsibility Principle (SRP)
   */
  const refreshData = () => {
    loadUsers()
    loadRoles()
    if (selectedUser) {
      userRoleService.fetchUserRoles(parseInt(selectedUser))
    }
  }

  // Effects
  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      userRoleService.fetchUserRoles(parseInt(selectedUser))
    }
  }, [selectedUser])

  return {
    // State
    users: users || [],
    roles: roles || [],
    userRoles: userRoles || [],
    selectedUser,
    searchTerm,
    loading,
    dataLoading,
    assignDialogOpen,
    selectedRole,
    expiryDate,
    filteredUsers,
    
    // Setters
    setSelectedUser,
    setSearchTerm,
    setAssignDialogOpen,
    setSelectedRole,
    setExpiryDate,
    
    // Functions
    getRoleName,
    getUserName,
    getAvailableRoles,
    handleAssignRole,
    handleRevokeRole,
    formatDate,
    refreshData
  }
}