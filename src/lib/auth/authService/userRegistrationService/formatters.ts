/**
 * Response Formatters untuk User Registration Service
 * Menangani formatting response sesuai Single Responsibility Principle
 */

import { UserResponse, UserCreateData, BulkRegistrationResult, RegistrationStatistics } from './types';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from './constants';

/**
 * Interface untuk API Response yang konsisten
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Interface untuk Paginated Response
 */
export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Interface untuk Bulk Operation Response
 */
export interface BulkOperationResponse extends ApiResponse {
  summary: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  details: {
    successful: UserResponse[];
    failed: Array<{
      data: UserCreateData;
      error: string;
      index: number;
    }>;
  };
}

/**
 * User Registration Response Formatter
 */
export class UserRegistrationResponseFormatter {
  /**
   * Format successful user registration response
   */
  static formatUserRegistrationSuccess(
    user: UserResponse,
    requestId?: string
  ): ApiResponse<UserResponse> {
    return {
      success: true,
      message: SUCCESS_MESSAGES.REGISTRATION.USER_CREATED,
      data: this.sanitizeUserResponse(user),
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Format user registration error response
   */
  static formatUserRegistrationError(
    error: string | Error,
    requestId?: string
  ): ApiResponse {
    const errorMessage = error instanceof Error ? error.message : error;
    
    return {
      success: false,
      message: ERROR_MESSAGES.REGISTRATION.FAILED,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Format validation error response
   */
  static formatValidationError(
    errors: string[],
    requestId?: string
  ): ApiResponse {
    return {
      success: false,
      message: ERROR_MESSAGES.VALIDATION.FAILED,
      error: errors.join(', '),
      data: { validationErrors: errors },
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Format permission denied response
   */
  static formatPermissionDenied(
    action: string,
    requestId?: string
  ): ApiResponse {
    return {
      success: false,
      message: ERROR_MESSAGES.PERMISSION.ACCESS_DENIED,
      error: `Insufficient permissions for action: ${action}`,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Format bulk registration response
   */
  static formatBulkRegistrationResponse(
    result: BulkRegistrationResult,
    requestId?: string
  ): BulkOperationResponse {
    const total = result.successful.length + result.failed.length;
    const successRate = total > 0 ? (result.successful.length / total) * 100 : 0;

    return {
      success: result.failed.length === 0,
      message: result.failed.length === 0 
        ? SUCCESS_MESSAGES.BULK_OPERATION.ALL_SUCCESS
        : SUCCESS_MESSAGES.BULK_OPERATION.PARTIAL_SUCCESS,
      timestamp: new Date().toISOString(),
      requestId,
      summary: {
        total,
        successful: result.successful.length,
        failed: result.failed.length,
        successRate: Math.round(successRate * 100) / 100
      },
      details: {
        successful: result.successful.map(user => this.sanitizeUserResponse(user)),
        failed: result.failed.map((failure, index) => ({
          data: failure.data,
          error: failure.error,
          index
        }))
      }
    };
  }

  /**
   * Format statistics response
   */
  static formatStatisticsResponse(
    statistics: RegistrationStatistics,
    requestId?: string
  ): ApiResponse<RegistrationStatistics> {
    return {
      success: true,
      message: SUCCESS_MESSAGES.STATISTICS.GENERATED,
      data: statistics,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Format paginated users response
   */
  static formatPaginatedUsersResponse(
    users: UserResponse[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    requestId?: string
  ): PaginatedResponse<UserResponse[]> {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    
    return {
      success: true,
      message: SUCCESS_MESSAGES.GENERAL.DATA_RETRIEVED,
      data: users.map(user => this.sanitizeUserResponse(user)),
      timestamp: new Date().toISOString(),
      requestId,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1
      }
    };
  }

  /**
   * Format user profile response
   */
  static formatUserProfileResponse(
    user: UserResponse,
    includePermissions: boolean = false,
    requestId?: string
  ): ApiResponse<UserResponse> {
    const sanitizedUser = this.sanitizeUserResponse(user);
    
    // Add additional profile information if needed
    const profileData = {
      ...sanitizedUser,
      ...(includePermissions && {
        permissions: user.role?.permissions || []
      })
    };

    return {
      success: true,
      message: SUCCESS_MESSAGES.GENERAL.DATA_RETRIEVED,
      data: profileData,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Format generic success response
   */
  static formatSuccessResponse(
    message: string,
    data?: any,
    requestId?: string
  ): ApiResponse {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Format generic error response
   */
  static formatErrorResponse(
    message: string,
    error?: string | Error,
    requestId?: string
  ): ApiResponse {
    const errorMessage = error instanceof Error ? error.message : error;
    
    return {
      success: false,
      message,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Sanitize user response to remove sensitive information
   */
  private static sanitizeUserResponse(user: UserResponse): UserResponse {
    // Remove sensitive fields that shouldn't be exposed in API responses
    const { ...sanitizedUser } = user;
    
    // Ensure no password or other sensitive data is included
    delete (sanitizedUser as any).password;
    delete (sanitizedUser as any).passwordHash;
    delete (sanitizedUser as any).resetToken;
    delete (sanitizedUser as any).verificationToken;
    
    return sanitizedUser;
  }
}

/**
 * Export formatter utilities
 */
export const formatters = {
  userRegistration: UserRegistrationResponseFormatter,
  
  // Convenience methods
  success: UserRegistrationResponseFormatter.formatSuccessResponse,
  error: UserRegistrationResponseFormatter.formatErrorResponse,
  validation: UserRegistrationResponseFormatter.formatValidationError,
  permission: UserRegistrationResponseFormatter.formatPermissionDenied
};

/**
 * Export individual formatter functions for convenience
 */
export const {
  formatUserRegistrationSuccess,
  formatUserRegistrationError,
  formatValidationError,
  formatPermissionDenied,
  formatBulkRegistrationResponse,
  formatStatisticsResponse,
  formatPaginatedUsersResponse,
  formatUserProfileResponse,
  formatSuccessResponse,
  formatErrorResponse
} = UserRegistrationResponseFormatter;

/**
 * Default export
 */
export default UserRegistrationResponseFormatter;