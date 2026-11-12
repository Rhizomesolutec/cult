import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCartSessionId } from "@/lib/commerce";
import { Order } from "@/lib/models/Order";
import { requestAtomToken } from "@/lib/payments/nttdata/client";
import {
  createMerchTxnId,
  getNttDataConfig,
  resolveAtomReturnAppUrl,
  resolveCheckoutJsUrl,
} from "@/lib/payments/nttdata/config";
import { nttdataDiag } from "@/lib/payments/nttdata/diagnostics";
import {
  createOrderAccessToken,
  issueOrderViewToken,
} from "@/lib/payments/nttdata/order-access";
import { payableAmount } from "@/lib/pricing";

function publicInitiateError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (
    message.startsWith("Missing required environment variable") ||
    message.includes("is set but empty")
  ) {
    return "Payment gateway is not configured";
  }
  if (
    message.includes("NTTDATA_RETURN_APP_URL") ||
    message.includes("Atom UAT requires a public HTTPS return URL")
  ) {
    return message;
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
      let access = "";
      try {
        access = await issueOrderViewToken(order);
      } catch {
        access = createOrderAccessToken(String(order._id), order.sessionId);
      }
      return NextResponse.json({
        alreadyPaid: true,
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        access,
      });
    }

    if (order.status === "cancelled") {
      return NextResponse.json(
        { error: "Order is cancelled and cannot be paid" },
        { status: 400 },
      );
    }

    if (order.status === "failed") {
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

    // Validate public HTTPS Atom return URL before requesting a token.
    const config = getNttDataConfig();
    const returnOrigin = resolveAtomReturnAppUrl(config.appUrl);
    const returnUrl = `${returnOrigin.appUrl}/api/payments/nttdata/callback`;
    let returnHost = "";
    try {
      returnHost = new URL(returnUrl).hostname;
    } catch {
      returnHost = "";
    }

    // Fresh Atom token every attempt — required for the hosted UAT payment page.
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

    const resolvedCheckout = await resolveCheckoutJsUrl(
      result.config.checkoutJsUrl,
    );

    nttdataDiag("initiate", "info", "ready", {
      orderIdLen: String(order._id).length,
      merchTxnIdLen: result.merchTxnId.length,
      atomTokenIdLen: result.atomTokenId.length,
      merchIdLen: result.config.merchantId.length,
      amount: payableAmount(order),
      txnStatusCode: result.txnStatusCode,
      returnHost,
      returnUrlIsHttps: true,
      returnUrlSource: returnOrigin.source,
      checkoutJsFallback: resolvedCheckout.usedFallback,
      checkoutHost: resolvedCheckout.checkoutJsUrl.startsWith("/")
        ? "local_fallback"
        : "pgtest.atomtech.in",
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
      checkoutJsUrl: resolvedCheckout.checkoutJsUrl,
      checkoutJsFallback: resolvedCheckout.usedFallback,
      env: "uat" as const,
      returnUrlIsLocal: false,
      returnUrlIsHttps: true,
      returnUrlSource: returnOrigin.source,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    const publicMessage = publicInitiateError(error);
    const status =
      publicMessage.includes("NTTDATA_RETURN_APP_URL") ||
      publicMessage.includes("Atom UAT requires a public HTTPS return URL")
        ? 400
        : 500;
    nttdataDiag("initiate", "error", "failed", {
      httpStatus: status,
      owner: message.includes("NTT DATA request failed")
        ? "atom_or_network"
        : "application",
      reason: publicMessage.slice(0, 160),
    });
    return NextResponse.json({ error: publicMessage }, { status });
  }
}
