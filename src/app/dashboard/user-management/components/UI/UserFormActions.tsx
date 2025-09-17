import { Button } from "@/components/shadcn/ui/button"
import { IconDeviceFloppy, IconX } from "@tabler/icons-react"

/**
 * Props untuk UserFormActions component
 */
interface UserFormActionsProps {
  mode: 'create' | 'edit'
  isLoading: boolean
  onCancel: () => void
  onSubmit: (e: React.FormEvent) => void
  isFormValid?: boolean
}

/**
 * Komponen action buttons untuk form user
 * Mengikuti prinsip SRP - hanya bertanggung jawab untuk form actions
 */
export function UserFormActions({
  mode,
  isLoading,
  onCancel,
  onSubmit,
  isFormValid = true
}: UserFormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-6 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <IconX className="h-4 w-4" />
        Cancel
      </Button>
      
      <Button
        type="submit"
        onClick={onSubmit}
        disabled={isLoading || !isFormValid}
        className="flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {mode === 'create' ? 'Creating...' : 'Updating...'}
          </>
        ) : (
          <>
            <IconDeviceFloppy className="h-4 w-4" />
            {mode === 'create' ? 'Create User' : 'Update User'}
          </>
        )}
      </Button>
    </div>
  )
}