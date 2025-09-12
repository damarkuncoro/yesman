// Re-export dari authentication middleware yang baru
// Mengikuti prinsip DRY dengan menghindari duplikasi kode
export type { AuthenticatedUser } from "./types";
export { 
  withAuthorization as withFeature,
  withAuthentication,
  getUserFromHeaders as getUserInfoFromHeaders
} from "./auth/authMiddleware";

// Backward compatibility export
export { getUserFromHeaders as getUserFromRequest } from "./auth/authMiddleware";

// Import untuk backward compatibility
import { withAuthorization } from "./auth/authMiddleware";

/**
 * Contoh penggunaan:
 * 
 * // Di API route file (e.g., /api/users/route.ts)
 * import { withFeature, getUserFromRequest } from '@/lib/withFeature';
 * 
 * async function handleGetUsers(req: NextRequest) {
 *   const user = getUserFromRequest(req);
 *   console.log('Authenticated user:', user);
 *   
 *   // Logic untuk mengambil users
 *   return NextResponse.json({ users: [] });
 * }
 * 
 * // Export dengan authorization wrapper
 * export const GET = withFeature('user_management', 'read')(handleGetUsers);
 * export const POST = withFeature('user_management', 'create')(handleCreateUser);
 */