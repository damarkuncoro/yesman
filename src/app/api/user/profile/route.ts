import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/services/userService";
import { authService } from "@/lib/auth/authService";
import { ErrorHandler, errorUtils } from "@/lib/errors/errorHandler";
import { z } from "zod";

/**
 * Schema untuk update profile
 */
const updateProfileSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter").optional(),
  email: z.string().email("Format email tidak valid").optional(),
});

/**
 * Helper function untuk extract user ID dari Authorization header
 */
/**
 * Helper function untuk extract user ID dari Authorization header
 * @param request - NextRequest object
 * @returns Promise<number> - User ID
 * @throws AuthenticationError - Jika token tidak valid atau tidak ditemukan
 */
async function getUserIdFromToken(request: NextRequest): Promise<number> {
  const authHeader = request.headers.get("authorization");
  const userAgent = request.headers.get("user-agent");
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  
  const context = {
    userAgent,
    ip,
    endpoint: "/api/user/profile",
    timestamp: new Date().toISOString()
  };
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw errorUtils.authentication(
      "Token tidak ditemukan dalam header Authorization",
      {
        ...context,
        reason: "missing_authorization_header",
        expectedFormat: "Bearer <token>",
        receivedHeader: authHeader || "null"
      }
    );
  }
  
  const token = authHeader.substring(7); // Remove "Bearer " prefix
  
  if (!token || token.trim() === "") {
    throw errorUtils.authentication(
      "Token kosong dalam header Authorization",
      {
        ...context,
        reason: "empty_token",
        tokenLength: token?.length || 0
      }
    );
  }
  
  try {
    const payload = await authService.verifyToken(token);
    
    if (!payload) {
      throw errorUtils.authentication(
        "Token tidak valid atau telah kedaluwarsa",
        {
          ...context,
          reason: "invalid_token_payload",
          tokenPrefix: token.substring(0, 10) + "..."
        }
      );
    }
    
    if (!payload.userId) {
      throw errorUtils.authentication(
        "Token tidak mengandung informasi user ID",
        {
          ...context,
          reason: "missing_user_id_in_payload",
          payloadKeys: Object.keys(payload)
        }
      );
    }
    
    return payload.userId;
    
  } catch (error) {
    if (error instanceof Error && error.name.includes("Error")) {
      // Re-throw custom errors
      throw error;
    }
    
    // Handle JWT verification errors
    throw errorUtils.authentication(
      "Gagal memverifikasi token",
      {
        ...context,
        reason: "token_verification_failed",
        originalError: error instanceof Error ? error.message : String(error)
      }
    );
  }
}

/**
 * API route untuk mendapatkan profil user
 * GET /api/user/profile
 * 
 * Headers:
 * Authorization: Bearer <access_token>
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "user": { ... }
 *   }
 * }
 */
/**
 * API route untuk mendapatkan profil user
 * GET /api/user/profile
 * 
 * Headers:
 * Authorization: Bearer <access_token>
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "user": { ... }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Extract user ID dari token
    const userId = await getUserIdFromToken(request);
    
    // Ambil data user
    const user = await userService.getUserById(userId);
    
    if (!user) {
      const error = errorUtils.notFound(
        "User",
        userId,
        {
          operation: "get_user_profile",
          endpoint: "/api/user/profile",
          method: "GET",
          userId,
          timestamp: new Date().toISOString()
        }
      );
      
      ErrorHandler.logError(error, "GET /api/user/profile");
      return ErrorHandler.createErrorResponse(error);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        user,
      },
    }, { status: 200 });
    
  } catch (error) {
    // Log error dengan context
    ErrorHandler.logError(error, "GET /api/user/profile");
    
    // Return formatted error response
    return ErrorHandler.createErrorResponse(error);
  }
}

/**
 * API route untuk update profil user
 * PUT /api/user/profile
 * 
 * Headers:
 * Authorization: Bearer <access_token>
 * 
 * Body:
 * {
 *   "name": "string" (optional),
 *   "email": "string" (optional)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "user": { ... }
 *   }
 * }
 */
/**
 * API route untuk update profil user
 * PUT /api/user/profile
 * 
 * Headers:
 * Authorization: Bearer <access_token>
 * Content-Type: application/json
 * 
 * Body:
 * {
 *   "name": "string",
 *   "email": "string"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "user": { ... }
 *   },
 *   "message": "Profil berhasil diperbarui"
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    // Extract user ID dari token
    const userId = await getUserIdFromToken(request);
    
    // Parse request body dengan error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      throw errorUtils.validation(
        "Format JSON tidak valid",
        {
          operation: "parse_request_body",
          endpoint: "/api/user/profile",
          method: "PUT",
          error: parseError instanceof Error ? parseError.message : String(parseError),
          timestamp: new Date().toISOString()
        }
      );
    }
    
    // Validasi input dengan Zod
     let validatedData;
     try {
       validatedData = updateProfileSchema.parse(body);
     } catch (zodError) {
       if (zodError instanceof z.ZodError) {
         throw errorUtils.validation(
           "Data input tidak valid",
           {
             operation: "validate_update_data",
             endpoint: "/api/user/profile",
             method: "PUT",
             userId,
             validationErrors: zodError.issues.map((err: z.ZodIssue) => ({
               field: err.path.join('.'),
               message: err.message,
               code: err.code,
               received: 'received' in err ? err.received : undefined
             })),
             receivedData: body,
             timestamp: new Date().toISOString()
           }
         );
       }
       throw zodError;
     }
    
    // Update profil user dengan error handling
    const updatedUser = await userService.updateUserProfile(userId, validatedData);
    
    if (!updatedUser) {
      const error = errorUtils.notFound(
        "User",
        userId,
        {
          operation: "update_user_profile",
          endpoint: "/api/user/profile",
          method: "PUT",
          userId,
          updateData: validatedData,
          timestamp: new Date().toISOString()
        }
      );
      
      ErrorHandler.logError(error, "PUT /api/user/profile");
      return ErrorHandler.createErrorResponse(error);
    }
    
    return NextResponse.json({
      success: true,
      message: "Profil berhasil diperbarui",
      data: {
        user: updatedUser,
      },
    }, { status: 200 });
    
  } catch (error) {
    // Log error dengan context
    ErrorHandler.logError(error, "PUT /api/user/profile");
    
    // Return formatted error response
    return ErrorHandler.createErrorResponse(error);
  }
}