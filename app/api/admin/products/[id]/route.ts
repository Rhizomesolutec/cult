import { NextResponse } from "next/server";
import { requireAdmin, slugify } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { toProductDTO } from "@/lib/types/commerce";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    const body = (await req.json()) as Partial<{
      name: string;
      slug: string;
      series: string;
      description: string;
      price: number;
      currency: string;
      image: string;
      stock: number;
      featured: boolean;
      active: boolean;
    }>;

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name.trim();
    if (body.series !== undefined) update.series = body.series.trim();
    if (body.description !== undefined) {
      update.description = body.description.trim();
    }
    if (body.image !== undefined) update.image = body.image.trim();
    if (body.currency !== undefined) {
      update.currency = body.currency.trim().toUpperCase() || "INR";
    }
    if (body.slug !== undefined) update.slug = slugify(body.slug);
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      }
      update.price = price;
    }
    if (body.stock !== undefined) {
      const stock = Number(body.stock);
      if (!Number.isFinite(stock) || stock < 0) {
        return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
      }
      update.stock = Math.floor(stock);
    }
    if (body.featured !== undefined) update.featured = Boolean(body.featured);
    if (body.active !== undefined) update.active = Boolean(body.active);

    await connectDB();
    const product = await Product.findByIdAndUpdate(id, update, {
      new: true,
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      product: { ...toProductDTO(product), active: product.active },
    });
  } catch (error) {
    console.error("[PATCH /api/admin/products/:id]", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/products/:id]", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
