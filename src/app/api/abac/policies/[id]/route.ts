import { NextRequest, NextResponse } from "next/server";
import { abacService } from "@/services";

/**
 * DELETE /api/abac/policies/[id]
 * Hapus policy ABAC berdasarkan ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const policyId = parseInt(resolvedParams.id, 10);
    
    if (isNaN(policyId)) {
      return NextResponse.json(
        { error: "Policy ID harus berupa angka" },
        { status: 400 }
      );
    }

    const success = await abacService.deletePolicy(policyId);
    
    if (!success) {
      return NextResponse.json(
        { error: "Policy tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Policy berhasil dihapus" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error menghapus policy:", error);
    return NextResponse.json(
      { error: "Gagal menghapus policy" },
      { status: 500 }
    );
  }
}