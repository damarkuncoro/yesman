import { IconUser } from "@tabler/icons-react"
import { UserFormData } from '../LOGIC/useUserCreateEdit'
import { BaseFormCard } from './base/BaseFormCard'
import { FormField } from './base/FormField'

/**
 * Props untuk UserBasicInfoForm component
 */
interface UserBasicInfoFormProps {
  mode: 'create' | 'edit'
  formData: UserFormData
  errors: Partial<UserFormData>
  handleInputChange: (field: keyof UserFormData, value: string) => void
}

/**
 * Komponen form untuk informasi dasar user (email, name)
 * Mengikuti prinsip SRP - hanya bertanggung jawab untuk basic info form
 * Refactored untuk menggunakan BaseFormCard dan FormField (DRY principle)
 */
export function UserBasicInfoForm({
  mode,
  formData,
  errors,
  handleInputChange
}: UserBasicInfoFormProps) {
  const title = mode === 'create' ? 'Create New User' : 'Edit User'
  const description = mode === 'create' 
    ? 'Enter user information and set initial password'
    : 'Update user information and optionally change password'

  return (
    <BaseFormCard
      icon={<IconUser />}
      title={title}
      description={description}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            type="input"
            id="email"
            label="Email"
            required
            inputType="email"
            value={formData.email}
            onChange={(value) => handleInputChange('email', value)}
            placeholder="user@company.com"
            disabled={mode === 'edit'} // Email tidak bisa diubah
            error={errors.email}
          />
          
          <FormField
            type="input"
            id="name"
            label="Full Name"
            required
            value={formData.name}
            onChange={(value) => handleInputChange('name', value)}
            placeholder="John Doe"
            error={errors.name}
          />
        </div>
      </div>
    </BaseFormCard>
  )
}