import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { assembleCart, getCartDTO } from "@/lib/cart-service";
import { getOrCreateCartSessionId } from "@/lib/commerce";
import { Cart } from "@/lib/models/Cart";
import { Product } from "@/lib/models/Product";
import mongoose from "mongoose";

function isMongoId(value: string) {
  return mongoose.Types.ObjectId.isValid(value) && /^[a-f0-9]{24}$/i.test(value);
}

async function findActiveProduct(productId?: string, slug?: string) {
  if (productId && isMongoId(productId)) {
    return Product.findOne({ _id: productId, active: true });
  }
  const key = slug?.trim() || productId?.trim();
  if (!key) return null;
  return Product.findOne({ slug: key, active: true });
}

export async function GET() {
  try {
    const sessionId = await getOrCreateCartSessionId();
    const cart = await getCartDTO(sessionId);
    return NextResponse.json({ cart });
  } catch (error) {
    console.error("[GET /api/cart]", error);
    return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      productId?: string;
      slug?: string;
      quantity?: number;
    };

    const quantity = Math.max(1, Math.floor(body.quantity ?? 1));
    if (!body.productId?.trim() && !body.slug?.trim()) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }

    await connectDB();
    const product = await findActiveProduct(body.productId, body.slug);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (product.stock < 1) {
      return NextResponse.json({ error: "Out of stock" }, { status: 400 });
    }

    const sessionId = await getOrCreateCartSessionId();
    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = await Cart.create({ sessionId, items: [] });
    }

    const existing = cart.items.find(
      (item) => String(item.productId) === String(product._id),
    );
    const nextQty = Math.min(
      product.stock,
      (existing?.quantity ?? 0) + quantity,
    );

    if (existing) {
      existing.quantity = nextQty;
    } else {
      cart.items.push({ productId: product._id, quantity: nextQty });
    }

    await cart.save();
    const products = await Product.find({
      _id: { $in: cart.items.map((item) => item.productId) },
      active: true,
    }).lean();
    return NextResponse.json({
      cart: assembleCart(cart.items, products),
    });
  } catch (error) {
    console.error("[POST /api/cart]", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      productId?: string;
      quantity?: number;
    };

    const productId = body.productId?.trim();
    const quantity = Math.floor(body.quantity ?? 0);

    if (!productId) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }

    await connectDB();
    const product = await findActiveProduct(productId);
    const lineId = product ? String(product._id) : productId;
    if (!product && !isMongoId(productId)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const sessionId = await getOrCreateCartSessionId();
    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter((item) => String(item.productId) !== lineId);
    } else {
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      const line = cart.items.find((item) => String(item.productId) === lineId);
      if (!line) {
        return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
      }
      line.quantity = Math.min(product.stock, quantity);
    }

    await cart.save();
    const products = await Product.find({
      _id: { $in: cart.items.map((item) => item.productId) },
      active: true,
    }).lean();
    return NextResponse.json({ cart: assembleCart(cart.items, products) });
  } catch (error) {
    console.error("[PATCH /api/cart]", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    await connectDB();
    const sessionId = await getOrCreateCartSessionId();
    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      return NextResponse.json({
        cart: {
          items: [],
          itemCount: 0,
          subtotal: 0,
          deliveryCharge: 0,
          total: 0,
          currency: "INR",
        },
      });
    }

    if (productId) {
      const product = isMongoId(productId)
        ? null
        : await Product.findOne({ slug: productId, active: true }).select("_id");
      const lineId = product ? String(product._id) : productId;
      cart.items = cart.items.filter((item) => String(item.productId) !== lineId);
      await cart.save();
    } else {
      cart.items = [];
      await cart.save();
    }

    const products = await Product.find({
      _id: { $in: cart.items.map((item) => item.productId) },
      active: true,
    }).lean();
    return NextResponse.json({ cart: assembleCart(cart.items, products) });
  } catch (error) {
    console.error("[DELETE /api/cart]", error);
    return NextResponse.json({ error: "Failed to clear cart" }, { status: 500 });
  }
}
