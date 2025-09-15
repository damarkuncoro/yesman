import { NextRequest, NextResponse } from "next/server";
import { abacService } from "@/services";
import { updateUserAbacSchema } from "@/db/schema";
import { z } from "zod";

/**
 * PUT /api/abac/users/[id]/attributes
 * Update user ABAC attributes (department, region, level)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id, 10);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "User ID harus berupa angka" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validasi input dengan Zod
    const validatedData = updateUserAbacSchema.parse(body);
    
    const updatedUser = await abacService.updateUserAttributes(
      userId,
      validatedData
    );
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        message: "User attributes berhasil diupdate",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          department: updatedUser.department,
          region: updatedUser.region,
          level: updatedUser.level
        }
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Data tidak valid",
          details: error.issues 
        },
        { status: 400 }
      );
    }
    
    console.error("Error mengupdate user attributes:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate user attributes" },
      { status: 500 }
    );
  }
}