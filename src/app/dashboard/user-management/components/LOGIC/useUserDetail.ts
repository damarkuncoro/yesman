import { useEffect } from 'react'
import { useApiCall } from './hooks'

/**
 * Interface untuk detail user yang dikembalikan dari API
 */
export interface UserDetail {
  user: {
    id: number
    email: string
    name: string
    roles: Array<{
      id: string
      name: string
      description: string
    }>
    department: string | null
    region: string | null
    active: boolean
    level: number
    createdAt: string
    updatedAt: string
    permissions: Array<{
      featureId: string
      featureName: string
      featureDescription: string
    }>
  }
}

/**
 * Custom hook untuk mengelola logic user detail
 * Menggunakan base hooks untuk menghilangkan duplikasi kode
 */
export function useUserDetail(userId: string | null) {
  const {
    data: userDetail,
    loading,
    execute: fetchUserDetail,
    reset
  } = useApiCall<UserDetail>({
    errorMessage: 'Gagal mengambil detail user'
  })

  /**
   * Refresh user detail data
   */
  const refreshUserDetail = () => {
    if (userId) {
      fetchUserDetail({ endpoint: `/users/${userId}` })
    }
  }

  useEffect(() => {
    if (!userId) {
      reset()
      return
    }

    fetchUserDetail({ endpoint: `/users/${userId}` })
  }, [userId, reset]) // Menghapus fetchUserDetail dari dependency array

  return {
    userDetail,
    loading,
    refreshUserDetail
  }
}