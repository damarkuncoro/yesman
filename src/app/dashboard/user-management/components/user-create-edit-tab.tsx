"use client"

import { useUserCreateEdit } from './LOGIC/useUserCreateEdit'
import { UserCreateEditDisplay } from './UI/UserCreateEditDisplay'

interface UserCreateEditTabProps {
  userId: string | null
  mode: 'create' | 'edit'
  onSuccess: () => void
}

/**
 * Komponen untuk create/edit user dengan ABAC attributes
 * Menggunakan custom hook untuk business logic dan UI component untuk presentasi
 */
export function UserCreateEditTab({ userId, mode, onSuccess }: UserCreateEditTabProps) {
  const {
    loading,
    loadingData,
    formData,
    availableRoles,
    errors,
    isUpdatingPassword,
    handleInputChange,
    handleRoleChange,
    handleSubmit,
    handleUpdatePassword,
    getSelectedRoleNames
  } = useUserCreateEdit(userId, mode, onSuccess)

  console.log(availableRoles)
  return (
    <UserCreateEditDisplay
      mode={mode}
      loading={loading}
      loadingData={loadingData}
      formData={formData}
      availableRoles={availableRoles}
      errors={errors}
      handleInputChange={handleInputChange}
      handleRoleChange={handleRoleChange}
      handleSubmit={handleSubmit}
      handleUpdatePassword={handleUpdatePassword}
      isUpdatingPassword={isUpdatingPassword}
      getSelectedRoleNames={getSelectedRoleNames}
      onCancel={onSuccess}
    />
  )
}