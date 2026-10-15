import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getCartDTO } from "@/lib/cart-service";
import {
  createOrderNumber,
  getOrCreateCartSessionId,
} from "@/lib/commerce";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";

const REUSE_WINDOW_MS = 30 * 60 * 1000;

function cartFingerprint(
  items: { productId: string; quantity: number; price: number }[],
  subtotal: number,
) {
  const lines = items
    .map((i) => `${i.productId}:${i.quantity}:${i.price}`)
    .sort()
    .join("|");
  return `${lines}|${subtotal}`;
}

function orderFingerprint(order: {
  items: { productId: unknown; quantity: number; unitPrice: number }[];
  subtotal: number;
}) {
  const lines = order.items
    .map(
      (i) =>
        `${String(i.productId)}:${i.quantity}:${i.unitPrice}`,
    )
    .sort()
    .join("|");
  return `${lines}|${order.subtotal}`;
}

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

    const fingerprint = cartFingerprint(cart.items, cart.subtotal);
    const reuseAfter = new Date(Date.now() - REUSE_WINDOW_MS);

    // Avoid duplicate pending orders on double-submit / retry.
    const existing = await Order.findOne({
      sessionId,
      status: "pending_payment",
      fulfillmentStatus: "awaiting_payment",
      createdAt: { $gte: reuseAfter },
    }).sort({ createdAt: -1 });

    if (existing && orderFingerprint(existing) === fingerprint) {
      existing.customer = { name, email, phone, address, city, pincode };
      await existing.save();
      return NextResponse.json({
        order: {
          id: String(existing._id),
          orderNumber: existing.orderNumber,
          subtotal: existing.subtotal,
          currency: existing.currency,
          status: existing.status,
          reused: true,
        },
      });
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
      payment: {
        provider: "nttdata",
        demoRef: "",
        gatewayPaymentId: "",
        merchTxnId: "",
        merchTxnDate: "",
        atomTokenId: "",
        atomTxnId: "",
        bankTxnId: "",
        lastStatusCode: "",
        lastStatusMessage: "",
      },
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
