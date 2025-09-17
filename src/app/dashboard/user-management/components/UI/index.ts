// Export semua komponen UI untuk user detail management// Refactored exports following DRY and SOLID principles
// Base components for reusability
export { BaseFormCard, FormField } from './base'

// Form components - refactored to use base components
export { UserBasicInfoForm } from './UserBasicInfoForm'
export { UserPasswordForm } from './UserPasswordForm'
export { UserRoleAssignmentForm } from './UserRoleAssignmentForm'
export { UserAbacAttributesForm } from './UserAbacAttributesForm'

// Display components
export { UserDetailDisplay } from './UserDetailDisplay'
export { UserDetailStates } from './UserDetailStates'
export { UserProfileCard } from './UserProfileCard'
export { UserRolesCard } from './UserRolesCard'
export { UserPermissionsCard } from './UserPermissionsCard'
export { UserCreateEditDisplay } from './UserCreateEditDisplay'
export { UserRoleAssignmentDisplay } from './UserRoleAssignmentDisplay'
export { UserListTable } from './UserListTable'

// Shared types
export type * from './types/FormTypes'

// Utility functions
export * from './utils/userDetailUtils'