"use client"

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useApiCall, useDebounce, usePerformanceMonitor, useBatchedUpdates } from './hooks'
import { USER_ENDPOINTS, ERROR_MESSAGES, SEARCH_CONFIG } from './constants'
import { toast } from './utils/toast'

/**
 * Interface untuk User
 */
export interface User {
  id: string
  name: string
  email: string
  role: string
  department: string
  region: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

/**
 * Interface untuk filter dan sorting
 */
export interface UserListFilters {
  search: string
  role: string
  status: 'all' | 'active' | 'inactive'
  department: string
  region: string
}

/**
 * Interface untuk sorting
 */
export interface UserListSorting {
  field: keyof User
  direction: 'asc' | 'desc'
}

/**
 * Interface untuk pagination
 */
export interface UserListPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * Fungsi untuk transformasi data user
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 * Memastikan ID selalu unique untuk mencegah duplicate keys
 */
export function transformUserData(rawData: any): User {
  // Pastikan ID selalu unique dengan fallback ke email + timestamp jika ID kosong
  const uniqueId = rawData.id?.toString() || 
                   `${rawData.email || 'unknown'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id: uniqueId,
    name: rawData.name || '',
    email: rawData.email || '',
    role: rawData.role || rawData.level || '',
    department: rawData.department || '',
    region: rawData.region || '',
    isActive: rawData.active ?? rawData.isActive ?? true,
    createdAt: rawData.createdAt,
    updatedAt: rawData.updatedAt
  }
}

/**
 * Fungsi untuk transformasi array data user
 * Mengikuti prinsip DRY (Don't Repeat Yourself)
 * Memastikan tidak ada duplicate keys dengan validasi ID unique
 */
export function transformUserListData(rawDataArray: any[]): User[] {
  if (!Array.isArray(rawDataArray)) {
    return []
  }
  
  const transformedUsers = rawDataArray.map(transformUserData)
  
  // Validasi untuk memastikan tidak ada duplicate IDs
  const seenIds = new Set<string>()
  const uniqueUsers: User[] = []
  
  transformedUsers.forEach((user, index) => {
    if (seenIds.has(user.id)) {
      // Jika ID sudah ada, buat ID baru dengan index
      const newId = `${user.id}_duplicate_${index}_${Date.now()}`
      console.warn(`Duplicate user ID detected: ${user.id}, creating new ID: ${newId}`)
      uniqueUsers.push({ ...user, id: newId })
      seenIds.add(newId)
    } else {
      uniqueUsers.push(user)
      seenIds.add(user.id)
    }
  })
  
  return uniqueUsers
}

/**
 * Hook untuk mengelola user list dengan advanced features
 * Mengikuti prinsip SOLID:
 * - SRP: Fokus pada user list management
 * - OCP: Dapat diperluas dengan filter dan sorting baru
 * - DIP: Bergantung pada abstraksi (useApiCall, useDebounce)
 */
export function useUserList() {
  // Performance monitoring
  const performanceMetrics = usePerformanceMonitor('UserList')

  // State management
  const [filters, setFilters] = useState<UserListFilters>({
    search: '',
    role: '',
    status: 'all',
    department: '',
    region: ''
  })

  const [sorting, setSorting] = useState<UserListSorting>({
    field: 'name',
    direction: 'asc'
  })

  const [pagination, setPagination] = useState<UserListPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Debounced search untuk performance
  const debouncedSearch = useDebounce(filters.search, 300)

  // API call dengan caching dan retry mechanism
  const {
    data: usersData,
    loading,
    error,
    execute: fetchUsers,
    clearCache
  } = useApiCall<{
    users: User[]
    pagination: {
      total: number
      totalPages: number
      currentPage: number
      limit: number
    }
  }>({
    method: 'GET',
    endpoint: '/users',
    errorMessage: 'Gagal mengambil data users',
    cacheKey: 'users-list',
    cacheConfig: { ttl: 2 * 60 * 1000 }, // 2 minutes
    retryConfig: { attempts: 3, delay: 1000, backoff: 'exponential' },
    transform: (data) => {
      // Transform dan validate data dari API
      let users: User[] = []
      
      if (Array.isArray(data)) {
        users = transformUserListData(data)
      } else if (data && Array.isArray(data.users)) {
        users = transformUserListData(data.users)
      }
      
      return {
        users,
        pagination: data.pagination || {
          total: 0,
          totalPages: 0,
          currentPage: 1,
          limit: 10
        }
      }
    }
  })

  const deleteUserApi = useApiCall<{ success: boolean }>({
    method: 'DELETE',
    errorMessage: 'Gagal menghapus user',
    retryConfig: { attempts: 2, delay: 1000 }
  })

  const bulkDeleteApi = useApiCall<{ success: boolean; deletedCount: number }>({
    method: 'POST',
    endpoint: '/users/bulk-delete',
    errorMessage: 'Gagal menghapus users',
    retryConfig: { attempts: 2, delay: 1000 }
  })

  // Memoized computed values
  const users = useMemo(() => {
    return usersData?.users || []
  }, [usersData])

  const isLoading = useMemo(() => {
    return loading || deleteUserApi.loading || bulkDeleteApi.loading
  }, [loading, deleteUserApi.loading, bulkDeleteApi.loading])

  const hasError = useMemo(() => {
    return !!(error || deleteUserApi.error || bulkDeleteApi.error)
  }, [error, deleteUserApi.error, bulkDeleteApi.error])

  const currentError = useMemo(() => {
    return error || deleteUserApi.error || bulkDeleteApi.error
  }, [error, deleteUserApi.error, bulkDeleteApi.error])

  // Filtered dan sorted users
  const processedUsers = useMemo(() => {
    let result = [...users]

    // Apply filters
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase()
      result = result.filter(user => 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.role) {
      result = result.filter(user => user.role === filters.role)
    }

    if (filters.status !== 'all') {
      result = result.filter(user => 
        filters.status === 'active' ? user.isActive : !user.isActive
      )
    }

    if (filters.department) {
      result = result.filter(user => user.department === filters.department)
    }

    if (filters.region) {
      result = result.filter(user => user.region === filters.region)
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sorting.field]
      const bValue = b[sorting.field]
      
      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0
      if (aValue === undefined) return 1
      if (bValue === undefined) return -1
      if (aValue === bValue) return 0
      
      const comparison = aValue < bValue ? -1 : 1
      return sorting.direction === 'asc' ? comparison : -comparison
    })

    return result
  }, [users, debouncedSearch, filters, sorting])

  // Selection helpers
  const isAllSelected = useMemo(() => {
    return processedUsers.length > 0 && selectedUsers.length === processedUsers.length
  }, [processedUsers.length, selectedUsers.length])

  const isIndeterminate = useMemo(() => {
    return selectedUsers.length > 0 && selectedUsers.length < processedUsers.length
  }, [selectedUsers.length, processedUsers.length])

  /**
   * Load users dengan parameter yang diberikan
   */
  const loadUsers = useCallback(async (params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
    department?: string
    region?: string
    sortField?: keyof User
    sortDirection?: 'asc' | 'desc'
  }) => {
    const queryParams = new URLSearchParams()
    
    // Build query parameters
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.search) queryParams.set('search', params.search)
    if (params?.role) queryParams.set('role', params.role)
    if (params?.status && params.status !== 'all') queryParams.set('status', params.status)
    if (params?.department) queryParams.set('department', params.department)
    if (params?.region) queryParams.set('region', params.region)
    if (params?.sortField) queryParams.set('sortField', params.sortField)
    if (params?.sortDirection) queryParams.set('sortDirection', params.sortDirection)

    const result = await fetchUsers({
      endpoint: `/users?${queryParams.toString()}`
    })

    if (result?.pagination) {
      setPagination(prev => ({
        ...prev,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
        page: result.pagination.currentPage
      }))
    }

    return result
  }, [fetchUsers])

  /**
   * Refresh data dengan parameter saat ini
   */
  const refreshUsers = useCallback(async () => {
    clearCache()
    return loadUsers({
      page: pagination.page,
      limit: pagination.limit,
      search: debouncedSearch,
      role: filters.role,
      status: filters.status,
      department: filters.department,
      region: filters.region,
      sortField: sorting.field,
      sortDirection: sorting.direction
    })
  }, [
    clearCache,
    loadUsers,
    pagination.page,
    pagination.limit,
    debouncedSearch,
    filters,
    sorting
  ])

  /**
   * Update filter dengan batched updates
   */
  const updateFilter = useCallback((key: keyof UserListFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [setFilters])

  /**
   * Update multiple filters sekaligus
   */
  const updateFilters = useCallback((newFilters: Partial<UserListFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }))
  }, [setFilters])

  /**
   * Reset filters ke kondisi awal
   */
  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      role: '',
      status: 'all',
      department: '',
      region: ''
    })
  }, [setFilters])

  /**
   * Update sorting
   */
  const updateSorting = useCallback((field: keyof User, direction?: 'asc' | 'desc') => {
    setSorting(prev => ({
      field,
      direction: direction || (prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc')
    }))
  }, [])

  /**
   * Update pagination
   */
  const updatePagination = useCallback((updates: Partial<UserListPagination>) => {
    setPagination(prev => ({
      ...prev,
      ...updates
    }))
  }, [])

  /**
   * Go to specific page
   */
  const goToPage = useCallback((page: number) => {
    updatePagination({ page })
  }, [updatePagination])

  /**
   * Change page size
   */
  const changePageSize = useCallback((limit: number) => {
    updatePagination({ limit, page: 1 })
  }, [updatePagination])

  /**
   * Select/deselect user
   */
  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }, [])

  /**
   * Select/deselect all users
   */
  const toggleAllSelection = useCallback(() => {
    setSelectedUsers(prev => 
      prev.length === processedUsers.length
        ? []
        : processedUsers.map(user => user.id)
    )
  }, [processedUsers])

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    setSelectedUsers([])
  }, [])

  /**
   * Delete single user
   */
  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    const result = await deleteUserApi.execute({
      endpoint: `/users/${userId}`
    })

    if (result?.success) {
      toast.success('User berhasil dihapus')
      clearCache()
      await refreshUsers()
      
      // Remove from selection if selected
      setSelectedUsers(prev => prev.filter(id => id !== userId))
      
      return true
    }

    return false
  }, [deleteUserApi, clearCache, refreshUsers])

  /**
   * Delete multiple users
   */
  const deleteSelectedUsers = useCallback(async (): Promise<boolean> => {
    if (selectedUsers.length === 0) {
      toast.error('Tidak ada user yang dipilih')
      return false
    }

    const result = await bulkDeleteApi.execute({
      body: { userIds: selectedUsers }
    })

    if (result?.success) {
      toast.success(`${result.deletedCount} user berhasil dihapus`)
      clearCache()
      await refreshUsers()
      clearSelection()
      return true
    }

    return false
  }, [selectedUsers, bulkDeleteApi, clearCache, refreshUsers, clearSelection])

  // Auto-load users when filters or sorting change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        role: filters.role,
        status: filters.status,
        department: filters.department,
        region: filters.region,
        sortField: sorting.field,
        sortDirection: sorting.direction
      })
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [
    debouncedSearch,
    filters.role,
    filters.status,
    filters.department,
    filters.region,
    sorting.field,
    sorting.direction,
    pagination.page,
    pagination.limit
  ])

  return {
    // Data
    users: processedUsers,
    rawUsers: users,
    pagination,
    filters,
    sorting,
    selectedUsers,

    // Loading states
    isLoading,
    hasError,
    currentError,

    // Selection states
    isAllSelected,
    isIndeterminate,

    // Actions
    loadUsers,
    refreshUsers,
    updateFilter,
    updateFilters,
    resetFilters,
    updateSorting,
    updatePagination,
    goToPage,
    changePageSize,
    toggleUserSelection,
    toggleAllSelection,
    clearSelection,
    deleteUser,
    deleteSelectedUsers,

    // Performance metrics
    performanceMetrics
  }
}
