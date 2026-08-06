import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { toProductDTO } from "@/lib/types/commerce";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { slug } = await params;
    await connectDB();

    const product = await Product.findOne({ slug, active: true }).lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      product: toProductDTO(product),
    });
  } catch (error) {
    console.error("[GET /api/products/:slug]", error);
    return NextResponse.json(
      { error: "Failed to load product" },
      { status: 500 },
    );
  }
}
