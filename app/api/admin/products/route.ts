import { NextResponse } from "next/server";
import { requireAdmin, slugify } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { toProductDTO } from "@/lib/types/commerce";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      products: products.map((p) => ({
        ...toProductDTO(p),
        active: p.active,
        createdAt: (p as { createdAt?: Date }).createdAt,
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/products]", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      name?: string;
      slug?: string;
      series?: string;
      description?: string;
      price?: number;
      currency?: string;
      image?: string;
      stock?: number;
      featured?: boolean;
      active?: boolean;
    };

    const name = body.name?.trim() ?? "";
    const series = body.series?.trim() ?? "";
    const description = body.description?.trim() ?? "";
    const image = body.image?.trim() ?? "";
    const price = Number(body.price);
    const stock = Number(body.stock ?? 0);
    const currency = (body.currency?.trim() || "INR").toUpperCase();
    const slug = slugify(body.slug?.trim() || name);

    if (!name || !series || !description || !image || !slug) {
      return NextResponse.json(
        { error: "Name, series, description, image, and slug are required" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }
    if (!Number.isFinite(stock) || stock < 0) {
      return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
    }

    await connectDB();
    const existing = await Product.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 },
      );
    }

    const product = await Product.create({
      name,
      slug,
      series,
      description,
      price,
      currency,
      image,
      stock: Math.floor(stock),
      featured: Boolean(body.featured),
      active: body.active !== false,
    });

    return NextResponse.json(
      {
        product: {
          ...toProductDTO(product),
          active: product.active,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/admin/products]", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
