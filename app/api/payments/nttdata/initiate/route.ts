import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCartSessionId } from "@/lib/commerce";
import { Order } from "@/lib/models/Order";
import { requestAtomToken } from "@/lib/payments/nttdata/client";
import { createMerchTxnId } from "@/lib/payments/nttdata/config";
import { payableAmount } from "@/lib/pricing";

function publicInitiateError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (
    message.startsWith("Missing required environment variable") ||
    message.includes("is set but empty")
  ) {
    return "Payment gateway is not configured";
  }
  if (message.includes("UAT") || message.includes("disabled")) {
    return "Payment gateway configuration error";
  }
  return "Failed to initiate payment";
}

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
      return NextResponse.json({
        alreadyPaid: true,
        orderId: String(order._id),
        orderNumber: order.orderNumber,
      });
    }

    if (order.status === "cancelled") {
      return NextResponse.json(
        { error: "Order is cancelled and cannot be paid" },
        { status: 400 },
      );
    }

    if (order.status === "failed") {
      // Allow a new payment attempt after a prior failed attempt.
      order.status = "pending_payment";
      order.fulfillmentStatus = "awaiting_payment";
    }

    const phone = (order.customer.phone || "").replace(/\D/g, "");
    if (!order.customer.email || phone.length < 10) {
      return NextResponse.json(
        {
          error:
            "Customer email and a valid mobile number are required for payment",
        },
        { status: 400 },
      );
    }

    // Always request a fresh Atom token. The UAT SDK binds the token via mConfig;
    // reusing a token after a failed checkout-frame open commonly keeps failing.
    const merchTxnId = createMerchTxnId();
    const merchTxnDate = new Date().toISOString().slice(0, 10);
    const result = await requestAtomToken({
      amount: payableAmount(order),
      custEmail: order.customer.email,
      custMobile: phone.slice(-10),
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      merchTxnId,
    });

    order.status = "pending_payment";
    order.fulfillmentStatus = "awaiting_payment";
    order.payment = {
      ...order.payment,
      provider: "nttdata",
      demoRef: "",
      merchTxnId: result.merchTxnId,
      merchTxnDate,
      atomTokenId: result.atomTokenId,
      atomTxnId: order.payment?.atomTxnId || "",
      bankTxnId: "",
      gatewayPaymentId: "",
      lastStatusCode: result.txnStatusCode,
      lastStatusMessage: "Awaiting customer payment",
      verifiedAt: new Date(),
    };
    await order.save();

    // Callback/return URL is always derived from NEXT_PUBLIC_APP_URL (via config.appUrl).
    const returnUrl = `${result.config.appUrl}/api/payments/nttdata/callback`;
    let returnHost = "";
    let returnProtocol = "";
    try {
      const parsed = new URL(returnUrl);
      returnHost = parsed.hostname;
      returnProtocol = parsed.protocol;
    } catch {
      returnHost = "";
      returnProtocol = "";
    }
    const returnUrlIsLocal =
      returnHost === "localhost" || returnHost === "127.0.0.1";
    const returnUrlIsHttps = returnProtocol === "https:";

    // Safe diagnostics only — never log tokens, keys, customer data, or full URLs.
    console.info("[POST /api/payments/nttdata/initiate]", {
      httpStatus: 200,
      fields: [
        "atomTokenId",
        "merchId",
        "custEmail",
        "custMobile",
        "returnUrl",
        "checkoutJsUrl",
        "env",
      ],
      atomTokenIdLen: result.atomTokenId.length,
      merchIdLen: result.config.merchantId.length,
      txnStatusCode: result.txnStatusCode,
      returnHost,
      returnProtocol,
      returnUrlIsLocal,
      returnUrlIsHttps,
      checkoutJsHost: (() => {
        try {
          return new URL(result.config.checkoutJsUrl).hostname;
        } catch {
          return "invalid";
        }
      })(),
      env: "uat",
    });

    return NextResponse.json({
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      atomTokenId: result.atomTokenId,
      merchId: result.config.merchantId,
      custEmail: order.customer.email,
      custMobile: phone.slice(-10),
      returnUrl,
      checkoutJsUrl: result.config.checkoutJsUrl,
      env: "uat" as const,
      returnUrlIsLocal,
      returnUrlIsHttps,
    });
  } catch (error) {
    console.error(
      "[POST /api/payments/nttdata/initiate]",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json(
      { error: publicInitiateError(error) },
      { status: 500 },
    );
  }
}
