import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCartSessionId } from "@/lib/commerce";
import { notifyOrderPaid } from "@/lib/email/order-notifications";
import { Cart } from "@/lib/models/Cart";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      orderId?: string;
      outcome?: "success" | "failure";
    };

    const orderId = body.orderId?.trim();
    const outcome = body.outcome === "failure" ? "failure" : "success";

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    await connectDB();
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const sessionId = await getCartSessionId();
    if (!sessionId || order.sessionId !== sessionId) {
      return NextResponse.json({ error: "Unauthorized order" }, { status: 403 });
    }

    if (order.status === "paid") {
      return NextResponse.json({
        order: {
          id: String(order._id),
          orderNumber: order.orderNumber,
          status: order.status,
          fulfillmentStatus: order.fulfillmentStatus,
          demoRef: order.payment?.demoRef,
        },
      });
    }

    if (outcome === "failure") {
      order.status = "failed";
      order.fulfillmentStatus = "cancelled";
      await order.save();
      return NextResponse.json({
        order: {
          id: String(order._id),
          orderNumber: order.orderNumber,
          status: order.status,
          fulfillmentStatus: order.fulfillmentStatus,
        },
      });
    }

    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product || product.stock < item.quantity) {
        order.status = "failed";
        order.fulfillmentStatus = "cancelled";
        await order.save();
        return NextResponse.json(
          { error: "Stock changed — payment cancelled" },
          { status: 400 },
        );
      }
    }

    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
      );
    }

    const demoRef = `DEMO-${randomUUID().slice(0, 8).toUpperCase()}`;
    order.status = "paid";
    order.payment = {
      provider: "demo",
      demoRef,
      gatewayPaymentId: demoRef,
      paidAt: new Date(),
    };
    await order.save();

    await notifyOrderPaid(order);

    await Cart.findOneAndUpdate({ sessionId }, { items: [] });

    return NextResponse.json({
      order: {
        id: String(order._id),
        orderNumber: order.orderNumber,
        status: order.status,
        fulfillmentStatus: order.fulfillmentStatus,
        demoRef,
        subtotal: order.subtotal,
        currency: order.currency,
      },
    });
  } catch (error) {
    console.error("[POST /api/payments/demo]", error);
    return NextResponse.json(
      { error: "Demo payment failed" },
      { status: 500 },
    );
  }
}
