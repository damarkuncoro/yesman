"use client"

import { UserFormLoadingState } from './UserFormLoadingState'
import { UserBasicInfoForm } from './UserBasicInfoForm'
import { UserPasswordForm } from './UserPasswordForm'
import { UserAbacAttributesForm } from './UserAbacAttributesForm'
import { UserRoleAssignmentForm } from './UserRoleAssignmentForm'
import { UserFormActions } from './UserFormActions'
import { UserFormData, Role } from '../LOGIC/useUserCreateEdit'

/**
 * Props untuk UserCreateEditDisplay component
 */
interface UserCreateEditDisplayProps {
  mode: 'create' | 'edit'
  loading: boolean
  loadingData: boolean
  formData: UserFormData
  availableRoles: Role[]
  errors: Partial<UserFormData>
  handleInputChange: (field: keyof UserFormData, value: string) => void
  handleRoleChange: (roleId: string, checked: boolean) => void
  handleSubmit: (e: React.FormEvent) => void
  handleUpdatePassword: () => void
  isUpdatingPassword: boolean
  getSelectedRoleNames: () => string[]
  onCancel: () => void
}

/**
 * UserCreateEditDisplay Component - Orchestrator
 * 
 * Komponen orchestrator yang mengkoordinasikan semua sub-komponen form user.
 * Mengikuti prinsip SRP dan DDD dengan memecah tanggung jawab ke komponen-komponen kecil.
 */
export function UserCreateEditDisplay({
  mode,
  loading,
  loadingData,
  formData,
  availableRoles,
  errors,
  handleInputChange,
  handleRoleChange,
  handleSubmit,
  handleUpdatePassword,
  isUpdatingPassword,
  getSelectedRoleNames,
  onCancel
}: UserCreateEditDisplayProps) {
  // Show loading state saat fetch data
  if (loadingData) {
    return <UserFormLoadingState />
  }

  console.log(availableRoles)
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information Form */}
      <UserBasicInfoForm
        mode={mode}
        formData={formData}
        errors={errors}
        handleInputChange={handleInputChange}
      />

      {/* Password Form */}
      <UserPasswordForm
          mode={mode}
          formData={formData}
          errors={errors}
          handleInputChange={handleInputChange}
          onUpdatePassword={handleUpdatePassword}
          isUpdatingPassword={isUpdatingPassword}
        />

      {/* ABAC Attributes Form */}
      <UserAbacAttributesForm
        formData={formData}
        errors={errors}
        handleInputChange={handleInputChange}
      />

      {/* Role Assignment Form */}
       <UserRoleAssignmentForm
         formData={formData}
         errors={errors}
         handleRoleChange={handleRoleChange}
         availableRoles={availableRoles.map(role => ({
           id: role.id.toString(),
           name: role.name,
           description: role.grantsAll ? 'Full Access' : 'Limited Access'
         }))}
       />

       {/* Action Buttons */}
       <UserFormActions
         mode={mode}
         isLoading={loading}
         onCancel={onCancel}
         onSubmit={handleSubmit}
       />
    </form>
  )
}