import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { seedProductsIfEmpty } from "@/lib/seed-products";
import { toProductDTO } from "@/lib/types/commerce";

export async function GET() {
  try {
    await connectDB();
    await seedProductsIfEmpty();

    const products = await Product.find({ active: true })
      .sort({ featured: -1, createdAt: 1 })
      .lean();

    return NextResponse.json({
      products: products.map((p) => toProductDTO(p)),
    });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 },
    );
  }
}
