import { IconLock, IconKey } from "@tabler/icons-react"
import { Button } from "@/components/shadcn/ui/button"
import { UserFormData, usePasswordVisibility } from '../LOGIC/useUserCreateEdit'
import { BaseFormCard } from './base/BaseFormCard'
import { PasswordField } from './base/PasswordField'

/**
 * Props untuk UserPasswordForm component
 */
interface UserPasswordFormProps {
  mode: 'create' | 'edit'
  formData: UserFormData
  errors: Partial<UserFormData>
  handleInputChange: (field: keyof UserFormData, value: string) => void
  onUpdatePassword?: () => void
  isUpdatingPassword?: boolean
}

/**
 * Komponen form untuk password dan confirm password
 * Mengikuti prinsip SRP - hanya bertanggung jawab untuk password form
 * Refactored untuk menggunakan BaseFormCard dan FormField (DRY principle)
 */
export function UserPasswordForm({
  mode,
  formData,
  errors,
  handleInputChange,
  onUpdatePassword,
  isUpdatingPassword = false
}: UserPasswordFormProps) {
  const description = mode === 'create' 
    ? 'Set initial password for the user'
    : 'Leave blank to keep current password'

  // Password visibility hook
  const {
    showPassword,
    showConfirmPassword,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    getPasswordInputType,
    getVisibilityText
  } = usePasswordVisibility()

  /**
   * Handle update password button click
   * Mengikuti prinsip SRP - hanya bertanggung jawab untuk trigger update password
   */
  const handleUpdatePassword = () => {
    if (onUpdatePassword && formData.password && formData.confirmPassword) {
      onUpdatePassword()
    }
  }

  /**
   * Check if password fields are filled and valid for update
   */
  const canUpdatePassword = mode === 'edit' && 
    formData.password && 
    formData.confirmPassword && 
    formData.password === formData.confirmPassword &&
    !errors.password &&
    !errors.confirmPassword

  return (
    <BaseFormCard
      icon={<IconLock />}
      title="Password"
      description={description}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PasswordField
            id="password"
            label="Password"
            required={mode === 'create'}
            value={formData.password || ''}
            onChange={(value) => handleInputChange('password', value)}
            placeholder="Enter password"
            error={errors.password}
            isVisible={showPassword}
            onToggleVisibility={togglePasswordVisibility}
            toggleAriaLabel={getVisibilityText(showPassword)}
          />
          
          <PasswordField
            id="confirmPassword"
            label="Confirm Password"
            required={mode === 'create'}
            value={formData.confirmPassword || ''}
            onChange={(value) => handleInputChange('confirmPassword', value)}
            placeholder="Confirm password"
            error={errors.confirmPassword}
            isVisible={showConfirmPassword}
            onToggleVisibility={toggleConfirmPasswordVisibility}
            toggleAriaLabel={getVisibilityText(showConfirmPassword)}
          />
        </div>

        {/* Update Password Button - hanya muncul di mode edit */}
        {mode === 'edit' && onUpdatePassword && (
          <div className="flex justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleUpdatePassword}
              disabled={!canUpdatePassword || isUpdatingPassword}
              className="flex items-center gap-2"
            >
              {isUpdatingPassword ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Updating Password...
                </>
              ) : (
                <>
                  <IconKey className="h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </BaseFormCard>
  )
}