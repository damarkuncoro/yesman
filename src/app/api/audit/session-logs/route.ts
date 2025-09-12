import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sessionRepository } from "@/repositories/session/sessionRepository";
import { userRepository } from "@/repositories/user/userRepository";
import { withAuthentication } from "@/lib/auth/authMiddleware";

/**
 * Schema untuk validasi query parameters session logs
 */
const sessionLogsQuerySchema = z.object({
  action: z.string().optional(),
  userId: z.string().optional(),
  success: z.string().optional(),
  ipAddress: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

/**
 * Schema untuk validasi request body session logs
 */
const sessionLogsBodySchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(20),
});

/**
 * GET /api/audit/session-logs
 * Mengambil data session logs dengan filtering dan pagination
 */
export const GET = withAuthentication(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validasi query parameters
    const validatedQuery = sessionLogsQuerySchema.parse(queryParams);
    
    const page = parseInt(validatedQuery.page || '1');
    const limit = parseInt(validatedQuery.limit || '20');
    const offset = (page - 1) * limit;
    
    // Ambil semua sessions dari database
    const allSessions = await sessionRepository.findAll();
    
    // Filter sessions berdasarkan query parameters
    let filteredSessions = allSessions;
    
    if (validatedQuery.userId) {
      const userId = parseInt(validatedQuery.userId);
      if (!isNaN(userId)) {
        filteredSessions = filteredSessions.filter(session => session.userId === userId);
      }
    }
    
    // Konversi sessions ke format session logs
    const sessionLogs = await Promise.all(
      filteredSessions.map(async (session) => {
        // Ambil data user
        const user = await userRepository.findById(session.userId);
        
        // Tentukan action berdasarkan status session
        const now = new Date();
        const isExpired = session.expiresAt < now;
        const action = isExpired ? 'logout' : 'login';
        
        return {
          id: session.id,
          userId: session.userId,
          sessionId: session.refreshToken.substring(0, 8) + '...', // Tampilkan sebagian token saja
          action,
          ipAddress: null, // Tidak ada data IP di tabel sessions
          userAgent: null, // Tidak ada data user agent di tabel sessions
          success: true, // Semua session di database dianggap sukses
          reason: null,
          createdAt: session.createdAt,
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department || undefined,
            region: user.region || undefined,
          } : undefined,
        };
      })
    );
    
    // Filter berdasarkan action jika ada
    let finalSessions = sessionLogs;
    if (validatedQuery.action) {
      finalSessions = sessionLogs.filter(log => log.action === validatedQuery.action);
    }
    
    // Filter berdasarkan success jika ada
    if (validatedQuery.success) {
      const successFilter = validatedQuery.success === 'true';
      finalSessions = finalSessions.filter(log => log.success === successFilter);
    }
    
    // Pagination
    const paginatedSessions = finalSessions.slice(offset, offset + limit);
    
    // Hitung statistik
    const stats = {
      total: finalSessions.length,
      byAction: finalSessions.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      successRate: finalSessions.length > 0 
        ? (finalSessions.filter(log => log.success).length / finalSessions.length) * 100 
        : 0,
      uniqueUsers: new Set(finalSessions.map(log => log.userId)).size,
      uniqueIPs: new Set(finalSessions.map(log => log.ipAddress).filter(Boolean)).size,
    };
    
    return NextResponse.json({
      sessions: paginatedSessions,
      stats,
      pagination: {
        page,
        limit,
        total: finalSessions.length,
        totalPages: Math.ceil(finalSessions.length / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching session logs:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters', 
          details: error.issues 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/audit/session-logs
 * Mengambil session logs terbaru
 */
export const POST = withAuthentication(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validatedBody = sessionLogsBodySchema.parse(body);
    
    // Ambil sessions terbaru
    const allSessions = await sessionRepository.findAll();
    const recentSessions = allSessions.slice(0, validatedBody.limit);
    
    // Konversi ke format session logs
    const sessionLogs = await Promise.all(
      recentSessions.map(async (session) => {
        const user = await userRepository.findById(session.userId);
        
        const now = new Date();
        const isExpired = session.expiresAt < now;
        const action = isExpired ? 'logout' : 'login';
        
        return {
          id: session.id,
          userId: session.userId,
          sessionId: session.refreshToken.substring(0, 8) + '...',
          action,
          ipAddress: null,
          userAgent: null,
          success: true,
          reason: null,
          createdAt: session.createdAt,
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department || undefined,
            region: user.region || undefined,
          } : undefined,
        };
      })
    );
    
    return NextResponse.json({
      sessions: sessionLogs,
      count: sessionLogs.length,
    });
    
  } catch (error) {
    console.error('Error fetching recent session logs:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request body', 
          details: error.issues 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});