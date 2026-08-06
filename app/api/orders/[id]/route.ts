import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCartSessionId } from "@/lib/commerce";
import { Order } from "@/lib/models/Order";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();

    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const sessionId = await getCartSessionId();
    if (!sessionId || order.sessionId !== sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      order: {
        id: String(order._id),
        orderNumber: order.orderNumber,
        status: order.status,
        fulfillmentStatus: order.fulfillmentStatus || "awaiting_payment",
        subtotal: order.subtotal,
        currency: order.currency,
        customer: order.customer,
        items: order.items.map((i) => ({
          name: i.name,
          image: i.image,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          lineTotal: i.unitPrice * i.quantity,
        })),
        payment: order.payment,
        delivery: order.delivery || {},
        createdAt: (order as { createdAt?: Date }).createdAt,
      },
    });
  } catch (error) {
    console.error("[GET /api/orders/:id]", error);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}
