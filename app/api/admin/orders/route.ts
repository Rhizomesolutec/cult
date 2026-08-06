import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";

function serializeOrder(o: {
  _id: unknown;
  orderNumber: string;
  status: string;
  fulfillmentStatus?: string;
  subtotal: number;
  currency: string;
  customer: unknown;
  items: {
    name: string;
    image: string;
    unitPrice: number;
    quantity: number;
  }[];
  payment?: unknown;
  delivery?: unknown;
  emailLog?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(o._id),
    orderNumber: o.orderNumber,
    status: o.status,
    fulfillmentStatus: o.fulfillmentStatus || "awaiting_payment",
    subtotal: o.subtotal,
    currency: o.currency,
    customer: o.customer,
    items: o.items.map((i) => ({
      name: i.name,
      image: i.image,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.unitPrice * i.quantity,
    })),
    payment: o.payment || {},
    delivery: o.delivery || {},
    emailLog: o.emailLog || [],
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const orders = await Order.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      orders: orders.map((o) =>
        serializeOrder({
          ...o,
          createdAt: (o as { createdAt?: Date }).createdAt,
          updatedAt: (o as { updatedAt?: Date }).updatedAt,
        }),
      ),
    });
  } catch (error) {
    console.error("[GET /api/admin/orders]", error);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 },
    );
  }
}
