import { NextResponse } from "next/server";

/**
 * GET /api/version
 * Endpoint untuk mendapatkan informasi versi API yang tersedia
 * Tidak memerlukan authentication
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        current_version: "v1",
        supported_versions: ["v1"],
        deprecated_versions: [],
        api_info: {
          name: "YesMan API",
          description: "Role-Based and Attribute-Based Access Control API",
          version: "1.0.0",
          documentation: "/api/docs"
        },
        endpoints: {
          v1: {
            base_url: "/api/v1",
            modules: [
              "auth",
              "users", 
              "rbac",
              "abac",
              "audit",
              "dashboard",
              "admin"
            ]
          }
        }
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}