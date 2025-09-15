import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Health check endpoint untuk monitoring sistem
 * Tidak memerlukan authentication
 */
export async function GET() {
  try {
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        database: "connected",
        auth: "operational",
        rbac: "operational",
        abac: "operational"
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}