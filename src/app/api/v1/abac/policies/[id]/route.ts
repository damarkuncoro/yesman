import { NextRequest, NextResponse } from "next/server";
import { abacService } from "@/services";

/**
 * GET /api/v1/abac/policies/[id]
 * Ambil policy ABAC berdasarkan ID
 */
export async function GET(
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

    const policy = await abacService.getPolicyById(policyId);
    
    if (!policy) {
      return NextResponse.json(
        { error: "Policy tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: policy 
    }, { status: 200 });
  } catch (error) {
    console.error("Error mengambil policy:", error);
    return NextResponse.json(
      { error: "Gagal mengambil policy" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/abac/policies/[id]
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