import { NextRequest, NextResponse } from "next/server";
import { accessLogRepository } from "@/repositories/accessLog";
import { withAuthentication } from "@/lib/auth/authMiddleware";
import { z } from "zod";

/**
 * Schema validasi untuk query parameters access logs
 */
const accessLogsQuerySchema = z.object({
  userId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  roleId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  featureId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  decision: z.enum(['allow', 'deny']).optional(),
  path: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0)
});

/**
 * GET /api/audit/access-logs
 * Mengambil data access logs dengan filtering dan pagination
 */
export const GET = withAuthentication(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse dan validasi query parameters
    const queryResult = accessLogsQuerySchema.safeParse({
      userId: searchParams.get('userId') || undefined,
      roleId: searchParams.get('roleId') || undefined,
      featureId: searchParams.get('featureId') || undefined,
      decision: searchParams.get('decision') || undefined,
      path: searchParams.get('path') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const filters = queryResult.data;

    // Ambil data access logs dengan filter
    const allLogs = await accessLogRepository.findWithFilters({
      userId: filters.userId,
      roleId: filters.roleId,
      featureId: filters.featureId,
      decision: filters.decision,
      pathPattern: filters.path,
      startDate: filters.startDate,
      endDate: filters.endDate
    });

    // Apply pagination manually
    const logs = allLogs.slice(filters.offset, filters.offset + filters.limit);

    // Hitung total untuk pagination
    const total = allLogs.length;

    // Hitung statistik
    const stats = {
      total: allLogs.length,
      allowed: allLogs.filter(log => log.decision === 'allow').length,
      denied: allLogs.filter(log => log.decision === 'deny').length,
      uniqueUsers: new Set(allLogs.filter(log => log.userId).map(log => log.userId)).size,
      uniquePaths: new Set(allLogs.map(log => log.path)).size
    };

    return NextResponse.json({
      success: true,
      data: {
        logs,
        stats,
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset + filters.limit) < total
      }
    });

  } catch (error) {
    console.error('Error fetching access logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/audit/access-logs
 * Mengambil access logs terbaru (untuk dashboard atau monitoring real-time)
 */
export const POST = withAuthentication(async (request: NextRequest) => {
  try {
    const body = await request.json();
    
    // Validasi body request
    const bodySchema = z.object({
      limit: z.number().int().positive().max(100).optional().default(10),
      userId: z.number().int().positive().optional(),
      decision: z.enum(['allow', 'deny']).optional()
    });
    
    const bodyResult = bodySchema.safeParse(body);
    if (!bodyResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: bodyResult.error.issues },
        { status: 400 }
      );
    }
    
    const validatedBody = bodyResult.data;

    // Ambil recent access logs
    const recentLogs = await accessLogRepository.findRecent(validatedBody.limit);

    return NextResponse.json({
      success: true,
      data: {
        logs: recentLogs,
        count: recentLogs.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching recent access logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});