// Re-export everything from user folder for backward compatibility
export * from './index';

// Specifically re-export the main UserService and userService instance
export { UserService, userService } from './index';

// Re-export types for backward compatibility
export type {
  AuthResponse,
  JWTPayload,
  UserProfileUpdateData,
  SanitizedUser,
  User,
  UserCreateInput
} from './index';