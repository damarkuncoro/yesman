import { UserDetail } from '../LOGIC/useUserDetail'
import { UserDetailStates } from './UserDetailStates'
import { UserProfileCard } from './UserProfileCard'
import { UserRolesCard } from './UserRolesCard'
import { UserPermissionsCard } from './UserPermissionsCard'

interface UserDetailDisplayProps {
  userDetail: UserDetail | null
  loading: boolean
  userId: string | null
  onUserEdit: (userId: string) => void
  onRoleAssignment: (userId: string) => void
}

/**
 * Komponen orchestrator untuk menampilkan detail user
 * Menggunakan komponen-komponen yang lebih kecil dan terorganisir
 * Menerapkan prinsip SRP (Single Responsibility Principle)
 */
export function UserDetailDisplay({ 
  userDetail, 
  loading, 
  userId, 
  onUserEdit, 
  onRoleAssignment 
}: UserDetailDisplayProps) {
  // Render state components untuk loading, empty, dan error states
  const stateComponent = (
    <UserDetailStates 
      userId={userId}
      loading={loading}
      userNotFound={!userDetail}
    />
  )
  
  // Jika ada state component yang perlu ditampilkan, return state component
  if (!userId || loading || !userDetail) {
    return stateComponent
  }

  // Render komponen utama dengan data user yang valid
  return (
    <div className="space-y-6">
      {/* User Profile Information */}
      <UserProfileCard 
        userDetail={userDetail}
        onUserEdit={onUserEdit}
        onRoleAssignment={onRoleAssignment}
      />

      {/* User Roles Information */}
      <UserRolesCard userDetail={userDetail} />

      {/* User Permissions Information */}
      <UserPermissionsCard userDetail={userDetail} />
    </div>
  )
}