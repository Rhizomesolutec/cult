import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import {
  notifyOrderDelivered,
  notifyOrderShipped,
} from "@/lib/email/order-notifications";
import { Order } from "@/lib/models/Order";
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
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const body = (await req.json()) as {
      fulfillmentStatus?: "packed" | "shipped" | "delivered" | "confirmed";
      agencyName?: string;
      agencyEmail?: string;
      trackingNumber?: string;
      notes?: string;
    };

    await connectDB();
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (body.agencyName !== undefined) {
      order.delivery.agencyName = body.agencyName.trim();
    }
    if (body.agencyEmail !== undefined) {
      order.delivery.agencyEmail = body.agencyEmail.trim();
    }
    if (body.trackingNumber !== undefined) {
      order.delivery.trackingNumber = body.trackingNumber.trim();
    }
    if (body.notes !== undefined) {
      order.delivery.notes = body.notes.trim();
    }

    const next = body.fulfillmentStatus;
    if (next === "packed" || next === "confirmed") {
      order.fulfillmentStatus = next;
      await order.save();
    } else if (next === "shipped") {
      await notifyOrderShipped(order);
    } else if (next === "delivered") {
      await notifyOrderDelivered(order);
    } else {
      await order.save();
    }

    return NextResponse.json({
      order: {
        id: String(order._id),
        orderNumber: order.orderNumber,
        status: order.status,
        fulfillmentStatus: order.fulfillmentStatus,
        customer: order.customer,
        delivery: order.delivery,
        emailLog: order.emailLog,
        payment: order.payment,
        subtotal: order.subtotal,
        items: order.items,
      },
    });
  } catch (error) {
    console.error("[PATCH /api/admin/orders/:id]", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
}
