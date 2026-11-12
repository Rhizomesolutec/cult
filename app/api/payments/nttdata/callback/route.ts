import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { CART_COOKIE } from "@/lib/commerce";
import { Order } from "@/lib/models/Order";
import {
  getPayInstrument,
  isSuccessfulPaymentStatus,
  parseCallbackEncData,
  requeryTransactionStatus,
  verifyPaymentResponseSignature,
  verifyStatusResponseSignature,
} from "@/lib/payments/nttdata/client";
import {
  getNttDataConfig,
  resolveCallbackAppUrl,
} from "@/lib/payments/nttdata/config";
import { nttdataDiag } from "@/lib/payments/nttdata/diagnostics";
import { applyVerifiedPaymentResult } from "@/lib/payments/nttdata/fulfill";
import {
  createOrderAccessToken,
  issueOrderViewToken,
} from "@/lib/payments/nttdata/order-access";
import { payableAmount } from "@/lib/pricing";
import type { OrderDocument } from "@/lib/models/Order";

export const runtime = "nodejs";

/**
 * Atom returns via cross-site POST. Restore the cart session cookie and attach
 * a short-lived order access token so /order/[id] can load after payment.
 */
async function redirectToOrder(
  appUrl: string,
  order: OrderDocument,
) {
  const orderId = String(order._id);
  const sessionId = String(order.sessionId);
  let access = "";
  try {
    access = await issueOrderViewToken(order);
  } catch {
    access = createOrderAccessToken(orderId, sessionId);
  }
  const res = NextResponse.redirect(
    `${appUrl}/order/${orderId}?access=${encodeURIComponent(access)}`,
  );
  // SameSite=None is required so the cookie is accepted on Atom's cross-site POST return.
  res.cookies.set(CART_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

async function handleCallback(req: Request) {
  let encData = "";
  const contentType = req.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as { encData?: string };
      encData = body.encData?.trim() || "";
    } else {
      const form = await req.formData();
      encData =
        String(form.get("encData") || form.get("encdata") || "").trim();
    }
  } catch {
    encData = "";
  }

  const appUrl = resolveCallbackAppUrl(req);
  nttdataDiag("callback", "info", "received", {
    method: req.method,
    hasEncData: Boolean(encData),
    encDataLen: encData ? encData.length : 0,
    returnHost: (() => {
      try {
        return new URL(appUrl).hostname;
      } catch {
        return "invalid";
      }
    })(),
  });

  if (!encData) {
    nttdataDiag("callback", "warn", "missing_encdata", {
      owner: "browser_or_atom",
    });
    return NextResponse.redirect(`${appUrl}/checkout?payment=missing_response`);
  }

  try {
    const config = getNttDataConfig();
    const payload = parseCallbackEncData(encData);
    const instrument = getPayInstrument(payload);
    if (!instrument) {
      nttdataDiag("callback", "error", "invalid_payload", {
        owner: "atom_or_decrypt",
      });
      return NextResponse.redirect(`${appUrl}/checkout?payment=invalid_response`);
    }

    const merchTxnId = String(instrument.merchDetails?.merchTxnId || "");
    const orderIdFromUdf = String(instrument.extras?.udf1 || "");

    await connectDB();
    const order = merchTxnId
      ? await Order.findOne({ "payment.merchTxnId": merchTxnId })
      : orderIdFromUdf
        ? await Order.findById(orderIdFromUdf)
        : null;

    if (!order) {
      nttdataDiag("callback", "error", "order_not_found", {
        merchTxnIdLen: merchTxnId.length,
        hasUdf1: Boolean(orderIdFromUdf),
        owner: "application",
      });
      return NextResponse.redirect(`${appUrl}/checkout?payment=order_not_found`);
    }

    let working = instrument;
    let signatureValid = verifyPaymentResponseSignature(working);
    const statusCode = String(working.responseDetails?.statusCode ?? "");
    nttdataDiag("callback", "info", "parsed", {
      orderIdLen: String(order._id).length,
      merchTxnIdLen: merchTxnId.length,
      statusCode: statusCode || "missing",
      signatureValid,
      atomTxnIdPresent: Boolean(working.payDetails?.atomTxnId),
    });

    if (
      isSuccessfulPaymentStatus(statusCode) &&
      !signatureValid &&
      order.payment?.merchTxnId &&
      (working.payDetails?.atomTxnId || order.payment.atomTxnId)
    ) {
      try {
        const atomTxnId = String(
          working.payDetails?.atomTxnId || order.payment.atomTxnId || "",
        );
        const merchTxnDate =
          order.payment.merchTxnDate ||
          (order as { createdAt?: Date }).createdAt?.toISOString().slice(0, 10) ||
          new Date().toISOString().slice(0, 10);
        nttdataDiag("callback", "info", "requery_started", {
          merchTxnIdLen: order.payment.merchTxnId.length,
          atomTxnIdLen: atomTxnId.length,
        });
        const requery = await requeryTransactionStatus({
          merchTxnId: order.payment.merchTxnId,
          amount: payableAmount(order),
          atomTxnId,
          merchTxnDate,
        });
        working = requery;
        const requerySig = String(requery.payDetails?.signature ?? "");
        signatureValid = requerySig
          ? verifyStatusResponseSignature(requery, payableAmount(order)) ||
            verifyPaymentResponseSignature(requery)
          : false;
        nttdataDiag("callback", "info", "requery_finished", {
          statusCode: String(requery.responseDetails?.statusCode ?? ""),
          signatureValid,
        });
      } catch (error) {
        nttdataDiag("callback", "error", "requery_failed", {
          owner: "atom_or_network",
          reason:
            error instanceof Error ? error.message.slice(0, 120) : "unknown",
        });
      }
    }

    try {
      const result = await applyVerifiedPaymentResult({
        order,
        instrument: working,
        expectedMerchantId: config.merchantId,
        requireSignatureValid: isSuccessfulPaymentStatus(
          String(working.responseDetails?.statusCode ?? ""),
        ),
        signatureValid,
      });
      nttdataDiag("callback", "info", "fulfillment", {
        orderStatus: result.order.status,
        fulfillmentStatus: result.order.fulfillmentStatus,
        markedPaid: result.markedPaid,
        alreadyPaid: result.alreadyPaid,
        markedFailed: result.markedFailed,
        stillPending: result.stillPending,
        signatureValid,
      });
    } catch (error) {
      nttdataDiag("callback", "error", "verification_failed", {
        owner: "application",
        reason:
          error instanceof Error ? error.message.slice(0, 120) : "unknown",
      });
      const latest = await Order.findById(order._id);
      if (!latest || latest.status === "paid") {
        return redirectToOrder(appUrl, latest || order);
      }
      latest.payment = {
        ...latest.payment,
        atomTxnId:
          String(working.payDetails?.atomTxnId || "") ||
          latest.payment?.atomTxnId ||
          "",
        lastStatusCode: String(working.responseDetails?.statusCode || ""),
        lastStatusMessage:
          "Payment verification pending — use Check payment status",
        verifiedAt: new Date(),
      };
      latest.status = "pending_payment";
      latest.fulfillmentStatus = "awaiting_payment";
      await latest.save();
    }

    const fresh = (await Order.findById(order._id)) || order;
    return redirectToOrder(appUrl, fresh);
  } catch (error) {
    nttdataDiag("callback", "error", "unhandled", {
      owner: "application_or_atom",
      reason: error instanceof Error ? error.message.slice(0, 120) : "unknown",
    });
    return NextResponse.redirect(`${appUrl}/checkout?payment=error`);
  }
}

export async function POST(req: Request) {
  return handleCallback(req);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const encData = url.searchParams.get("encData");
  if (encData) {
    const formReq = new Request(req.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encData }),
    });
    return handleCallback(formReq);
  }
  return NextResponse.redirect(
    `${resolveCallbackAppUrl(req)}/checkout?payment=missing_response`,
  );
}
