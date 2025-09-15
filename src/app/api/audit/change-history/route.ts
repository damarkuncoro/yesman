import { NextRequest, NextResponse } from "next/server";
import { changeHistoryRepository } from "@/repositories/changeHistory";
import { userRepository } from "@/repositories/user";
import { withAuthentication } from "@/lib/auth/authMiddleware";
import { z } from "zod";

/**
 * Schema validasi untuk query parameters change history
 */
const changeHistoryQuerySchema = z.object({
  action: z.string().optional(),
  adminUserId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  targetUserId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0)
});

/**
 * GET /api/audit/change-history
 * Mengambil data change history dengan filtering dan pagination
 */
export const GET = withAuthentication(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse dan validasi query parameters
    const queryResult = changeHistoryQuerySchema.safeParse({
      action: searchParams.get('action') || undefined,
      adminUserId: searchParams.get('adminUserId') || undefined,
      targetUserId: searchParams.get('targetUserId') || undefined,
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

    // Ambil data change history dengan filter
    let changes = await changeHistoryRepository.findAll();
    
    // Apply filters manually
    if (filters.action) {
      changes = changes.filter(c => c.action === filters.action);
    }
    if (filters.adminUserId) {
      changes = changes.filter(c => c.adminUserId === filters.adminUserId);
    }
    if (filters.targetUserId) {
      changes = changes.filter(c => c.targetUserId === filters.targetUserId);
    }
    if (filters.startDate) {
      changes = changes.filter(c => new Date(c.createdAt) >= filters.startDate!);
    }
    if (filters.endDate) {
      changes = changes.filter(c => new Date(c.createdAt) <= filters.endDate!);
    }
    
    // Enrich dengan data user untuk admin dan target
    const enrichedChanges = await Promise.all(
      changes.map(async (change) => {
        const adminUser = change.adminUserId ? await userRepository.findById(change.adminUserId) : null;
        const targetUser = change.targetUserId ? await userRepository.findById(change.targetUserId) : null;
        
        return {
          ...change,
          adminUser: adminUser ? {
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email,
            department: adminUser.department || undefined,
            region: adminUser.region || undefined,
          } : undefined,
          targetUser: targetUser ? {
            id: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            department: targetUser.department || undefined,
            region: targetUser.region || undefined,
          } : undefined,
        };
      })
    );
    
    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    const paginatedChanges = enrichedChanges.slice(offset, offset + limit);
    
    // Calculate stats manually
    const stats = {
      total: enrichedChanges.length,
      byAction: enrichedChanges.reduce((acc, c) => {
        acc[c.action] = (acc[c.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      uniqueAdmins: new Set(enrichedChanges.map(c => c.adminUserId).filter(Boolean)).size,
      uniqueTargets: new Set(enrichedChanges.map(c => c.targetUserId).filter(Boolean)).size
    };

    // Hitung total untuk pagination
    const total = await changeHistoryRepository.count();

    return NextResponse.json({
      success: true,
      data: {
        changes: paginatedChanges,
        stats,
        pagination: {
          total,
          limit: filters.limit,
          offset: filters.offset,
          hasMore: (filters.offset || 0) + (filters.limit || 50) < total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching change history:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/audit/change-history/recent
 * Mengambil change history terbaru (untuk monitoring real-time)
 */
export const POST = withAuthentication(async (request: NextRequest) => {
  try {
    const body = await request.json();
    
    // Validasi body untuk endpoint recent changes
    const recentChangesSchema = z.object({
      limit: z.number().min(1).max(100).default(20),
      action: z.string().optional(),
      adminUserId: z.number().optional(),
      targetUserId: z.number().optional()
    });

    const validatedBody = recentChangesSchema.parse(body);

    // Ambil recent change history
    let recentChanges = await changeHistoryRepository.findAll();
    
    // Apply filters
    if (validatedBody.action) {
      recentChanges = recentChanges.filter(c => c.action === validatedBody.action);
    }
    if (validatedBody.adminUserId) {
      recentChanges = recentChanges.filter(c => c.adminUserId === validatedBody.adminUserId);
    }
    if (validatedBody.targetUserId) {
      recentChanges = recentChanges.filter(c => c.targetUserId === validatedBody.targetUserId);
    }
    
    // Limit results
    recentChanges = recentChanges.slice(0, validatedBody.limit);
    
    // Enrich dengan data user
    const enrichedRecentChanges = await Promise.all(
      recentChanges.map(async (change) => {
        const adminUser = change.adminUserId ? await userRepository.findById(change.adminUserId) : null;
        const targetUser = change.targetUserId ? await userRepository.findById(change.targetUserId) : null;
        
        return {
          ...change,
          adminUser: adminUser ? {
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email,
            department: adminUser.department || undefined,
            region: adminUser.region || undefined,
          } : undefined,
          targetUser: targetUser ? {
            id: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            department: targetUser.department || undefined,
            region: targetUser.region || undefined,
          } : undefined,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        changes: enrichedRecentChanges,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching recent change history:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          details: error.issues
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});