import { NextResponse } from "next/server";
import { connectDB, isRetryableMongoError, resetDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { seedProductsIfEmpty } from "@/lib/seed-products";
import { toProductDTO } from "@/lib/types/commerce";

const CATALOG_CACHE_MS = 60_000;
const catalogCache = new Map<string, { at: number; body: string }>();

function readCatalogCache(key: string) {
  const hit = catalogCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CATALOG_CACHE_MS) {
    catalogCache.delete(key);
    return null;
  }
  return hit.body;
}

async function loadProducts(slugs: string[] | null) {
  await connectDB();
  await seedProductsIfEmpty();

  const query: { active: boolean; slug?: { $in: string[] } } = { active: true };
  if (slugs && slugs.length > 0) query.slug = { $in: slugs };

  const products = await Product.find(query)
    .sort({ featured: -1, createdAt: 1 })
    .lean();

  // Normal notebooks first, then A4 — keep relative order within each group.
  const sizeRank = (size?: string) => (size === "a4" ? 1 : 0);
  const ordered = [...products].sort(
    (a, b) => sizeRank(a.size) - sizeRank(b.size),
  );

  return ordered.map((p) => toProductDTO(p));
}

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("slugs");
  const slugs = requested
    ? requested
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean)
        .slice(0, 8)
    : null;
  const cacheKey = slugs?.slice().sort().join(",") || "*";
  const cached = readCatalogCache(cacheKey);
  if (cached) {
    return new NextResponse(cached, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
      },
    });
  }

  try {
    let products;
    try {
      products = await loadProducts(slugs);
    } catch (error) {
      if (!isRetryableMongoError(error)) throw error;
      console.error("[GET /api/products] retrying after database connection drop");
      await resetDB();
      products = await loadProducts(slugs);
    }

    const body = JSON.stringify({ products });
    catalogCache.set(cacheKey, { at: Date.now(), body });

    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 },
    );
  }
}
