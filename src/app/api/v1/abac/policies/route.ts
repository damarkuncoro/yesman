import { NextRequest, NextResponse } from "next/server";
import { abacService } from "@/services";
import { createPolicySchema } from "@/db/schema";
import { z } from "zod";

/**
 * GET /api/v1/abac/policies
 * Ambil semua policies berdasarkan feature ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get("featureId");

    if (!featureId) {
      return NextResponse.json(
        { error: "Feature ID diperlukan" },
        { status: 400 }
      );
    }

    const featureIdNum = parseInt(featureId, 10);
    if (isNaN(featureIdNum)) {
      return NextResponse.json(
        { error: "Feature ID harus berupa angka" },
        { status: 400 }
      );
    }

    const policies = await abacService.getPoliciesByFeature(featureIdNum);
    return NextResponse.json({ policies });
  } catch (error) {
    console.error("Error mengambil policies:", error);
    return NextResponse.json(
      { error: "Gagal mengambil policies" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/abac/policies
 * Buat policy ABAC baru
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validasi input dengan Zod
    const validatedData = createPolicySchema.parse(body);
    
    const policy = await abacService.createPolicy({
      featureId: validatedData.featureId,
      attribute: validatedData.attribute,
      operator: validatedData.operator,
      value: validatedData.value
    });
    
    return NextResponse.json(
      { 
        message: "Policy berhasil dibuat",
        policy 
      },
      { status: 201 }
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
    
    console.error("Error membuat policy:", error);
    return NextResponse.json(
      { error: "Gagal membuat policy" },
      { status: 500 }
    );
  }
}