import { NextRequest, NextResponse } from "next/server";
import { policyViolationRepository } from "@/repositories/policyViolation";
import { withAuthentication } from "@/lib/auth/authMiddleware";
import { z } from "zod";

/**
 * Schema validasi untuk query parameters policy violations
 */
const policyViolationsQuerySchema = z.object({
  userId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  featureId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  policyId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  attribute: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0)
});

/**
 * GET /api/audit/policy-violations
 * Mengambil data policy violations dengan filtering dan pagination
 */
export const GET = withAuthentication(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse dan validasi query parameters
    const queryResult = policyViolationsQuerySchema.safeParse({
      userId: searchParams.get('userId') || undefined,
      featureId: searchParams.get('featureId') || undefined,
      policyId: searchParams.get('policyId') || undefined,
      attribute: searchParams.get('attribute') || undefined,
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

    // Ambil data policy violations dengan filter
    let violations = await policyViolationRepository.findAll();
    
    // Apply filters manually since repository doesn't have findWithFilters
    if (filters.userId) {
      violations = violations.filter(v => v.userId === filters.userId);
    }
    if (filters.featureId) {
      violations = violations.filter(v => v.featureId === filters.featureId);
    }
    if (filters.policyId) {
      violations = violations.filter(v => v.policyId === filters.policyId);
    }
    if (filters.attribute) {
      violations = violations.filter(v => v.attribute === filters.attribute);
    }
    if (filters.startDate) {
      violations = violations.filter(v => new Date(v.createdAt) >= filters.startDate!);
    }
    if (filters.endDate) {
      violations = violations.filter(v => new Date(v.createdAt) <= filters.endDate!);
    }
    
    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    const paginatedViolations = violations.slice(offset, offset + limit);
    
    // Calculate stats manually
    const stats = {
      total: violations.length,
      byAttribute: violations.reduce((acc, v) => {
        acc[v.attribute] = (acc[v.attribute] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      uniqueUsers: new Set(violations.map(v => v.userId).filter(Boolean)).size,
      uniqueFeatures: new Set(violations.map(v => v.featureId).filter(Boolean)).size
    };

    // Hitung total untuk pagination
    const total = await policyViolationRepository.count();

    return NextResponse.json({
      success: true,
      data: {
        violations: paginatedViolations,
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
    console.error('Error fetching policy violations:', error);
    
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
 * POST /api/audit/policy-violations/recent
 * Mengambil policy violations terbaru (untuk monitoring real-time)
 */
export const POST = withAuthentication(async (request: NextRequest) => {
  try {
    const body = await request.json();
    
    // Validasi body untuk endpoint recent violations
    const recentViolationsSchema = z.object({
      limit: z.number().min(1).max(100).default(20),
      userId: z.number().optional(),
      attribute: z.string().optional(),
      featureId: z.number().optional()
    });

    const validatedBody = recentViolationsSchema.parse(body);

    // Ambil recent policy violations
    let recentViolations = await policyViolationRepository.findAll();
    
    // Apply filters
    if (validatedBody.userId) {
      recentViolations = recentViolations.filter(v => v.userId === validatedBody.userId);
    }
    if (validatedBody.attribute) {
      recentViolations = recentViolations.filter(v => v.attribute === validatedBody.attribute);
    }
    if (validatedBody.featureId) {
      recentViolations = recentViolations.filter(v => v.featureId === validatedBody.featureId);
    }
    
    // Limit results
    recentViolations = recentViolations.slice(0, validatedBody.limit);

    return NextResponse.json({
      success: true,
      data: {
        violations: recentViolations,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching recent policy violations:', error);
    
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