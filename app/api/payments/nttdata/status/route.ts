import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCartSessionId } from "@/lib/commerce";
import { notifyOrderPaid } from "@/lib/email/order-notifications";
import { Order } from "@/lib/models/Order";
import {
  requeryTransactionStatus,
  verifyPaymentResponseSignature,
  verifyStatusResponseSignature,
} from "@/lib/payments/nttdata/client";
import { getNttDataConfig } from "@/lib/payments/nttdata/config";
import { applyVerifiedPaymentResult } from "@/lib/payments/nttdata/fulfill";
import { payableAmount } from "@/lib/pricing";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { orderId?: string };
    const orderId = body.orderId?.trim();
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
      // Retry notifications if a prior emailLog failure left confirmation unsent (idempotent).
      try {
        await notifyOrderPaid(order);
      } catch (error) {
        console.error(
          "[POST /api/payments/nttdata/status] notification retry failed",
          error instanceof Error ? error.message : "unknown",
        );
      }
      const refreshed = await Order.findById(orderId);
      return NextResponse.json({
        order: {
          id: String(refreshed?._id || order._id),
          orderNumber: refreshed?.orderNumber || order.orderNumber,
          status: refreshed?.status || order.status,
          fulfillmentStatus:
            refreshed?.fulfillmentStatus || order.fulfillmentStatus,
          payment: refreshed?.payment || order.payment,
        },
        alreadyPaid: true,
      });
    }

    const merchTxnId = order.payment?.merchTxnId?.trim();
    if (!merchTxnId) {
      return NextResponse.json(
        { error: "No payment has been initiated for this order yet" },
        { status: 400 },
      );
    }

    // Status/Requery PDF marks atomTxnId as mandatory.
    const atomTxnId = order.payment?.atomTxnId?.trim();
    if (!atomTxnId) {
      return NextResponse.json(
        {
          error:
            "Atom transaction ID is not available yet. Complete or return from the payment page first, then try again.",
        },
        { status: 400 },
      );
    }

    const merchTxnDate =
      order.payment?.merchTxnDate?.trim() ||
      (order as { createdAt?: Date }).createdAt?.toISOString().slice(0, 10) ||
      new Date().toISOString().slice(0, 10);

    const config = getNttDataConfig();
    const instrument = await requeryTransactionStatus({
      merchTxnId,
      amount: payableAmount(order),
      atomTxnId,
      merchTxnDate,
    });

    const callbackSig = String(instrument.payDetails?.signature ?? "");
    // Requery PDF uses a different signature sequence than the callback API.
    // Prefer status-sequence verification; fall back to callback-sequence if that matches.
    let signatureValid = false;
    if (callbackSig) {
      signatureValid =
        verifyStatusResponseSignature(instrument, payableAmount(order)) ||
        verifyPaymentResponseSignature(instrument);
    }

    const result = await applyVerifiedPaymentResult({
      order,
      instrument,
      expectedMerchantId: config.merchantId,
      requireSignatureValid: Boolean(callbackSig),
      signatureValid,
    });

    return NextResponse.json({
      order: {
        id: String(result.order._id),
        orderNumber: result.order.orderNumber,
        status: result.order.status,
        fulfillmentStatus: result.order.fulfillmentStatus,
        payment: result.order.payment,
      },
      alreadyPaid: result.alreadyPaid,
      markedPaid: result.markedPaid,
      markedFailed: result.markedFailed,
      stillPending: result.stillPending,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to check payment status";
    console.error("[POST /api/payments/nttdata/status]", message);
    // Do not return raw gateway/Mongoose/internal details to the browser.
    const allowExact = new Set([
      "orderId is required",
      "Unauthorized order",
      "Order not found",
      "No payment has been initiated for this order yet",
      "Atom transaction ID is not available yet. Complete or return from the payment page first, then try again.",
    ]);
    const safe = allowExact.has(message)
      ? message
      : "Failed to check payment status";
    return NextResponse.json({ error: safe }, { status: 500 });
  }
}
