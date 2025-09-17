"use client"

import { useUserDetail } from './LOGIC/useUserDetail'
import { UserDetailDisplay } from './UI/UserDetailDisplay'

interface UserDetailTabProps {
  userId: string | null
  onUserEdit: (userId: string) => void
  onRoleAssignment: (userId: string) => void
}

/**
 * Komponen untuk menampilkan detail lengkap user
 * Menggunakan custom hook untuk logic dan UI component untuk presentasi
 */
export function UserDetailTab({ userId, onUserEdit, onRoleAssignment }: UserDetailTabProps) {
  const { userDetail, loading } = useUserDetail(userId)

  return (
    <UserDetailDisplay
      userDetail={userDetail}
      loading={loading}
      userId={userId}
      onUserEdit={onUserEdit}
      onRoleAssignment={onRoleAssignment}
    />
  )
}