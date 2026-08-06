import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCartDTO } from "@/lib/cart-service";
import {
  createOrderNumber,
  getOrCreateCartSessionId,
} from "@/lib/commerce";
import { Cart } from "@/lib/models/Cart";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      pincode?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const address = body.address?.trim() ?? "";
    const city = body.city?.trim() ?? "";
    const pincode = body.pincode?.trim() ?? "";

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 },
      );
    }

    await connectDB();
    const sessionId = await getOrCreateCartSessionId();
    const cart = await getCartDTO(sessionId);

    if (!cart.items.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.active || product.stock < item.quantity) {
        return NextResponse.json(
          { error: `${item.name} is unavailable or low on stock` },
          { status: 400 },
        );
      }
    }

    const order = await Order.create({
      orderNumber: createOrderNumber(),
      sessionId,
      customer: { name, email, phone, address, city, pincode },
      items: cart.items.map((i) => ({
        productId: new mongoose.Types.ObjectId(i.productId),
        name: i.name,
        image: i.image,
        unitPrice: i.price,
        quantity: i.quantity,
      })),
      subtotal: cart.subtotal,
      currency: cart.currency,
      status: "pending_payment",
      fulfillmentStatus: "awaiting_payment",
      payment: { provider: "demo", demoRef: "", gatewayPaymentId: "" },
      delivery: {
        agencyName: process.env.DELIVERY_AGENCY_NAME?.trim() || "",
        agencyEmail: process.env.DELIVERY_AGENCY_EMAIL?.trim() || "",
        trackingNumber: "",
        notes: "",
      },
      emailLog: [],
    });

    return NextResponse.json({
      order: {
        id: String(order._id),
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        currency: order.currency,
        status: order.status,
      },
    });
  } catch (error) {
    console.error("[POST /api/checkout]", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 },
    );
  }
}
