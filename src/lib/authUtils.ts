// Re-export dari authentication service yang baru
// Mengikuti prinsip DRY dengan menghindari duplikasi kode
export type { JWTPayload, AuthenticatedUserContext } from "./types";
export { 
  authService,
  verifyTokenAndGetUserContext,
  checkUserPermission,
  hasRole,
  hasAnyRole,
  createErrorResponse,
  isErrorResponse
} from "./auth/authService";

// Import untuk backward compatibility
import { authService } from "./auth/authService";