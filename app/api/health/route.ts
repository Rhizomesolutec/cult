import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { seedProductsIfEmpty } from "@/lib/seed-products";

export async function GET() {
  try {
    await connectDB();
    const result = await seedProductsIfEmpty();
    return NextResponse.json({
      ok: true,
      database: "Cultscribe",
      ...result,
    });
  } catch (error) {
    console.error("[GET /api/health]", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Connection failed",
      },
      { status: 500 },
    );
  }
}
