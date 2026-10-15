import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import {
  getPayInstrument,
  isSuccessfulPaymentStatus,
  parseCallbackEncData,
  requeryTransactionStatus,
  verifyPaymentResponseSignature,
  verifyStatusResponseSignature,
} from "@/lib/payments/nttdata/client";
import { getNttDataConfig } from "@/lib/payments/nttdata/config";
import { applyVerifiedPaymentResult } from "@/lib/payments/nttdata/fulfill";

export const runtime = "nodejs";

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
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

  const appUrl = appBaseUrl();

  if (!encData) {
    // Browser return without payload — do not mark the order failed.
    return NextResponse.redirect(`${appUrl}/checkout?payment=missing_response`);
  }

  try {
    const config = getNttDataConfig();
    const payload = parseCallbackEncData(encData);
    const instrument = getPayInstrument(payload);
    if (!instrument) {
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
      return NextResponse.redirect(`${appUrl}/checkout?payment=order_not_found`);
    }

    let working = instrument;
    let signatureValid = verifyPaymentResponseSignature(working);
    const statusCode = String(working.responseDetails?.statusCode ?? "");

    // If return claims success but signature is missing/invalid, confirm via Status API.
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
        const requery = await requeryTransactionStatus({
          merchTxnId: order.payment.merchTxnId,
          amount: order.subtotal,
          atomTxnId,
          merchTxnDate,
        });
        working = requery;
        const requerySig = String(requery.payDetails?.signature ?? "");
        signatureValid = requerySig
          ? verifyStatusResponseSignature(requery, order.subtotal) ||
            verifyPaymentResponseSignature(requery)
          : false;
      } catch (error) {
        console.error(
          "[NTT DATA callback] requery failed",
          error instanceof Error ? error.message : "unknown",
        );
      }
    }

    try {
      await applyVerifiedPaymentResult({
        order,
        instrument: working,
        expectedMerchantId: config.merchantId,
        requireSignatureValid: isSuccessfulPaymentStatus(
          String(working.responseDetails?.statusCode ?? ""),
        ),
        signatureValid,
      });
    } catch (error) {
      // Hard verification mismatches: keep pending (do not fail solely on return noise).
      console.error(
        "[NTT DATA callback] verification failed",
        error instanceof Error ? error.message : "unknown",
      );
      // Re-read DB status — in-memory `order` may be stale after an atomic paid claim.
      const latest = await Order.findById(order._id);
      if (!latest || latest.status === "paid") {
        return NextResponse.redirect(`${appUrl}/order/${String(order._id)}`);
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

    return NextResponse.redirect(`${appUrl}/order/${String(order._id)}`);
  } catch (error) {
    console.error(
      "[NTT DATA callback]",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.redirect(`${appUrl}/checkout?payment=error`);
  }
}

export async function POST(req: Request) {
  return handleCallback(req);
}

/** Some gateways may GET the return URL during testing. */
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
    `${appBaseUrl()}/checkout?payment=missing_response`,
  );
}
