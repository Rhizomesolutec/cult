import { NextResponse } from "next/server";
import { connectDB, isRetryableMongoError, resetDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { seedProductsIfEmpty } from "@/lib/seed-products";
import { toProductDTO } from "@/lib/types/commerce";

async function loadProducts() {
  await connectDB();
  await seedProductsIfEmpty();

  const products = await Product.find({ active: true })
    .sort({ featured: -1, createdAt: 1 })
    .lean();

  // Normal notebooks first, then A4 — keep relative order within each group.
  const sizeRank = (size?: string) => (size === "a4" ? 1 : 0);
  const ordered = [...products].sort(
    (a, b) => sizeRank(a.size) - sizeRank(b.size),
  );

  return ordered.map((p) => toProductDTO(p));
}

export async function GET() {
  try {
    let products;
    try {
      products = await loadProducts();
    } catch (error) {
      if (!isRetryableMongoError(error)) throw error;
      console.error("[GET /api/products] retrying after database connection drop");
      await resetDB();
      products = await loadProducts();
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 },
    );
  }
}
