// Refactored to use BaseFormCard and FormField for DRY and SOLID principles
import { IconShield } from "@tabler/icons-react"
import { BaseFormCard, FormField } from './base'
import { UserFormData } from '../LOGIC/useUserCreateEdit'

/**
 * Props untuk UserAbacAttributesForm component
 */
interface UserAbacAttributesFormProps {
  formData: UserFormData
  errors: Partial<UserFormData>
  handleInputChange: (field: keyof UserFormData, value: string) => void
}

/**
 * Komponen form untuk ABAC attributes (department, region, level, status)
 * Mengikuti prinsip SRP - hanya bertanggung jawab untuk ABAC attributes form
 */
export function UserAbacAttributesForm({
  formData,
  errors,
  handleInputChange
}: UserAbacAttributesFormProps) {
  return (
    <BaseFormCard
      title="ABAC Attributes"
      description="Set department, region, and level for attribute-based access control"
      icon={<IconShield className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          type="select"
          id="department"
          label="Department"
          required={true}
          value={formData.department || ''}
          onChange={(value) => handleInputChange('department', value)}
          placeholder="Select department"
          options={[
            { value: 'IT', label: 'IT' },
            { value: 'Sales', label: 'Sales' },
            { value: 'Marketing', label: 'Marketing' },
            { value: 'Finance', label: 'Finance' },
            { value: 'HR', label: 'HR' },
            { value: 'Operations', label: 'Operations' }
          ]}
          error={errors.department}
        />
        
        <FormField
          type="select"
          id="region"
          label="Region"
          required={true}
          value={formData.region || ''}
          onChange={(value) => handleInputChange('region', value)}
          placeholder="Select region"
          options={[
            { value: 'Jakarta', label: 'Jakarta' },
            { value: 'Surabaya', label: 'Surabaya' },
            { value: 'Bandung', label: 'Bandung' },
            { value: 'Medan', label: 'Medan' },
            { value: 'Semarang', label: 'Semarang' },
            { value: 'Yogyakarta', label: 'Yogyakarta' }
          ]}
          error={errors.region}
        />
        
        <FormField
          type="select"
          id="level"
          label="Level"
          required={true}
          value={formData.level || ''}
          onChange={(value) => handleInputChange('level', value)}
          placeholder="Select level"
          options={[
            { value: 'Junior', label: 'Junior' },
            { value: 'Senior', label: 'Senior' },
            { value: 'Manager', label: 'Manager' },
            { value: 'Director', label: 'Director' },
            { value: 'C-Level', label: 'C-Level' }
          ]}
          error={errors.level}
        />
      </div>
      
      <FormField
        type="select"
        id="status"
        label="Status"
        required={false}
        value={formData.status || ''}
        onChange={(value) => handleInputChange('status', value)}
        placeholder="Select status"
        options={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]}
        className="w-[200px]"
      />
    </BaseFormCard>
  )
}