import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCartDTO } from "@/lib/cart-service";
import { getOrCreateCartSessionId } from "@/lib/commerce";
import { Cart } from "@/lib/models/Cart";
import { Product } from "@/lib/models/Product";
import mongoose from "mongoose";

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
      quantity?: number;
    };

    const productId = body.productId?.trim();
    const quantity = Math.max(1, Math.floor(body.quantity ?? 1));

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findOne({
      _id: new mongoose.Types.ObjectId(productId),
      active: true,
    });
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
      (i) => String(i.productId) === String(product._id),
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
    const dto = await getCartDTO(sessionId);
    return NextResponse.json({ cart: dto });
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

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }

    await connectDB();
    const sessionId = await getOrCreateCartSessionId();
    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => String(i.productId) !== productId);
    } else {
      const product = await Product.findById(productId);
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      const line = cart.items.find((i) => String(i.productId) === productId);
      if (!line) {
        return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
      }
      line.quantity = Math.min(product.stock, quantity);
    }

    await cart.save();
    const dto = await getCartDTO(sessionId);
    return NextResponse.json({ cart: dto });
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
        cart: { items: [], itemCount: 0, subtotal: 0, currency: "INR" },
      });
    }

    if (productId) {
      cart.items = cart.items.filter((i) => String(i.productId) !== productId);
      await cart.save();
    } else {
      cart.items = [];
      await cart.save();
    }

    const dto = await getCartDTO(sessionId);
    return NextResponse.json({ cart: dto });
  } catch (error) {
    console.error("[DELETE /api/cart]", error);
    return NextResponse.json({ error: "Failed to clear cart" }, { status: 500 });
  }
}
