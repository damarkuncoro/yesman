import { IconUser } from "@tabler/icons-react"

/**
 * Props untuk UserFormLoadingState component
 */
interface UserFormLoadingStateProps {
  message?: string
}

/**
 * Komponen untuk menampilkan loading state pada form user
 * Mengikuti prinsip SRP - hanya bertanggung jawab untuk loading UI
 */
export function UserFormLoadingState({ 
  message = "Loading user data..." 
}: UserFormLoadingStateProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <IconUser className="h-8 w-8 animate-spin" />
      <span className="ml-2">{message}</span>
    </div>
  )
}