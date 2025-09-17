// Refactored to use BaseFormCard and FormField for DRY and SOLID principles
import { IconUserCheck } from "@tabler/icons-react"
import { BaseFormCard, FormField } from './base'
import { UserFormData } from '../LOGIC/useUserCreateEdit'
import { Checkbox } from "@/components/shadcn/ui/checkbox"
import { Badge } from "@/components/shadcn/ui/badge"

/**
 * Props untuk UserRoleAssignmentForm component
 */
interface UserRoleAssignmentFormProps {
  formData: UserFormData
  errors: Partial<UserFormData>
  handleRoleChange: (roleId: string, checked: boolean) => void
  availableRoles: Array<{
    id: string
    name: string
    description?: string
  }>
}

/**
 * Komponen form untuk role assignment
 * Mengikuti prinsip SRP - hanya bertanggung jawab untuk role assignment form
 */
export function UserRoleAssignmentForm({
  formData,
  errors,
  handleRoleChange,
  availableRoles
}: UserRoleAssignmentFormProps) {
  console.log(availableRoles)
  return (
    <BaseFormCard
      title="Role Assignment"
      description="Select roles to assign to this user"
      icon={<IconUserCheck className="h-5 w-5" />}
    >
      <div className="space-y-4">
        {availableRoles.map((role) => {
          const isChecked = formData.roles.includes(role.id)
          
          return (
            <div key={role.id} className="flex items-start space-x-3">
              <Checkbox
                id={`role-${role.id}`}
                checked={isChecked}
                onCheckedChange={(checked: boolean) => handleRoleChange(role.id, checked)}
              />
              <div className="flex-1">
                <label 
                  htmlFor={`role-${role.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {role.name}
                </label>
                {role.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {role.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
        
        {/* Display selected roles */}
        {formData.roles.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Selected Roles:</h4>
            <div className="flex flex-wrap gap-2">
              {formData.roles.map((roleId) => {
                const role = availableRoles.find(r => r.id === roleId)
                return role ? (
                  <Badge key={roleId} variant="secondary">
                    {role.name}
                  </Badge>
                ) : null
              })}
            </div>
          </div>
        )}
        
        {errors.roles && (
          <p className="text-sm text-destructive mt-2">{errors.roles}</p>
        )}
      </div>
    </BaseFormCard>
  )
}