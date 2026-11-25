import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCartSessionId } from "@/lib/commerce";
import { Order } from "@/lib/models/Order";
import { verifyOrderAccessToken } from "@/lib/payments/nttdata/order-access";
import { chargeForOrder } from "@/lib/pricing";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();

    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const sessionId = await getCartSessionId();
    const access = new URL(req.url).searchParams.get("access")?.trim() || "";
    const sessionOk = Boolean(sessionId && order.sessionId === sessionId);
    const accessOk = Boolean(
      access &&
        verifyOrderAccessToken(
          String(order._id),
          order.sessionId,
          access,
          order,
        ),
    );

    if (!sessionOk && !accessOk) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const money = chargeForOrder(order);

    return NextResponse.json({
      order: {
        id: String(order._id),
        orderNumber: order.orderNumber,
        status: order.status,
        fulfillmentStatus: order.fulfillmentStatus || "awaiting_payment",
        subtotal: order.subtotal,
        deliveryCharge: money.deliveryCharge,
        total: money.total,
        currency: order.currency,
        customer: order.customer,
        items: order.items.map((i) => ({
          name: i.name,
          image: i.image,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          lineTotal: i.unitPrice * i.quantity,
        })),
        payment: {
          merchTxnId: order.payment?.merchTxnId || undefined,
          atomTxnId: order.payment?.atomTxnId || undefined,
          gatewayPaymentId: order.payment?.gatewayPaymentId || undefined,
        },
        delivery: {
          trackingNumber: order.delivery?.trackingNumber || undefined,
        },
        createdAt: (order as { createdAt?: Date }).createdAt,
      },
    });
  } catch (error) {
    console.error("[GET /api/orders/:id]", error);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}
