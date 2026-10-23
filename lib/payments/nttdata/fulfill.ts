import { notifyOrderPaid } from "@/lib/email/order-notifications";
import { Cart } from "@/lib/models/Cart";
import { Order, type OrderDocument } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import type { AtomPaymentInstrument } from "./types";
import { formatNttAmount } from "./config";
import { payableAmount } from "@/lib/pricing";
import {
  isFailedPaymentStatus,
  isPendingPaymentStatus,
  isSuccessfulPaymentStatus,
} from "./client";

export type FulfillResult = {
  order: OrderDocument;
  alreadyPaid: boolean;
  markedPaid: boolean;
  markedFailed: boolean;
  stillPending: boolean;
};

function amountsMatch(
  orderAmount: number,
  gatewayAmount: number | string,
): boolean {
  return formatNttAmount(orderAmount) === formatNttAmount(Number(gatewayAmount));
}

/**
 * Idempotently apply a verified NTT DATA payment result to an order.
 * Inventory decrement + confirmation email run only on first successful transition.
 */
export async function applyVerifiedPaymentResult(input: {
  order: OrderDocument;
  instrument: AtomPaymentInstrument;
  expectedMerchantId: string;
  requireSignatureValid: boolean;
  signatureValid: boolean;
}): Promise<FulfillResult> {
  const { order, instrument, expectedMerchantId } = input;
  const merchId = String(instrument.merchDetails?.merchId ?? "");
  const merchTxnId = String(instrument.merchDetails?.merchTxnId ?? "");
  const atomTxnId = String(instrument.payDetails?.atomTxnId ?? "");
  const bankTxnId = String(
    instrument.payModeSpecificData?.bankDetails?.bankTxnId ?? "",
  );
  const statusCode = String(instrument.responseDetails?.statusCode ?? "");
  const message = String(instrument.responseDetails?.message ?? "");
  const totalAmount = instrument.payDetails?.totalAmount;
  const txnCurrency = instrument.payDetails?.txnCurrency;

  if (order.status === "paid") {
    return {
      order,
      alreadyPaid: true,
      markedPaid: false,
      markedFailed: false,
      stillPending: false,
    };
  }

  if (merchId && merchId !== String(expectedMerchantId)) {
    throw new Error("Merchant ID mismatch");
  }

  if (
    order.payment?.merchTxnId &&
    merchTxnId &&
    order.payment.merchTxnId !== merchTxnId
  ) {
    throw new Error("Merchant transaction ID mismatch");
  }

  if (
    txnCurrency != null &&
    String(txnCurrency).trim() !== "" &&
    String(txnCurrency).toUpperCase() !== "INR" &&
    String(txnCurrency).toUpperCase() !== String(order.currency || "INR").toUpperCase()
  ) {
    throw new Error("Currency mismatch");
  }

  const gatewayAmount =
    totalAmount ?? instrument.payDetails?.amount ?? null;
  if (gatewayAmount != null && !amountsMatch(payableAmount(order), gatewayAmount)) {
    throw new Error("Paid amount does not match order total");
  }

  const paymentPatch = {
    provider: "nttdata" as const,
    demoRef: "",
    merchTxnId: merchTxnId || order.payment?.merchTxnId || "",
    merchTxnDate: order.payment?.merchTxnDate || "",
    atomTokenId: order.payment?.atomTokenId || "",
    atomTxnId: atomTxnId || order.payment?.atomTxnId || "",
    bankTxnId: bankTxnId || order.payment?.bankTxnId || "",
    gatewayPaymentId:
      atomTxnId || bankTxnId || order.payment?.gatewayPaymentId || "",
    lastStatusCode: statusCode,
    lastStatusMessage: message,
    verifiedAt: new Date(),
  };

  if (isPendingPaymentStatus(statusCode) || !statusCode) {
    order.payment = { ...order.payment, ...paymentPatch };
    order.status = "pending_payment";
    order.fulfillmentStatus = "awaiting_payment";
    await order.save();
    return {
      order,
      alreadyPaid: false,
      markedPaid: false,
      markedFailed: false,
      stillPending: true,
    };
  }

  if (isFailedPaymentStatus(statusCode)) {
    order.payment = { ...order.payment, ...paymentPatch };
    order.status = "failed";
    order.fulfillmentStatus = "cancelled";
    await order.save();
    return {
      order,
      alreadyPaid: false,
      markedPaid: false,
      markedFailed: true,
      stillPending: false,
    };
  }

  if (!isSuccessfulPaymentStatus(statusCode)) {
    order.payment = { ...order.payment, ...paymentPatch };
    order.status = "pending_payment";
    order.fulfillmentStatus = "awaiting_payment";
    await order.save();
    return {
      order,
      alreadyPaid: false,
      markedPaid: false,
      markedFailed: false,
      stillPending: true,
    };
  }

  if (input.requireSignatureValid && !input.signatureValid) {
    order.payment = {
      ...order.payment,
      ...paymentPatch,
      lastStatusMessage:
        message || "Awaiting signature-verified confirmation",
    };
    order.status = "pending_payment";
    order.fulfillmentStatus = "awaiting_payment";
    await order.save();
    return {
      order,
      alreadyPaid: false,
      markedPaid: false,
      markedFailed: false,
      stillPending: true,
    };
  }

  for (const item of order.items) {
    const product = await Product.findById(item.productId);
    if (!product || product.stock < item.quantity) {
      order.payment = {
        ...order.payment,
        ...paymentPatch,
        lastStatusMessage: "Stock changed after payment — contact support",
      };
      order.status = "failed";
      order.fulfillmentStatus = "cancelled";
      await order.save();
      throw new Error("Stock changed — cannot fulfill paid order");
    }
  }

  // Atomic claim: only one concurrent callback/status can mark the order paid.
  const claimed = await Order.findOneAndUpdate(
    {
      _id: order._id,
      status: { $in: ["pending_payment", "failed"] },
    },
    {
      $set: {
        status: "paid",
        payment: {
          ...order.payment,
          ...paymentPatch,
          paidAt: new Date(),
        },
      },
    },
    { new: true },
  );

  if (!claimed) {
    const current = (await Order.findById(order._id)) as OrderDocument | null;
    if (current?.status === "paid") {
      return {
        order: current,
        alreadyPaid: true,
        markedPaid: false,
        markedFailed: false,
        stillPending: false,
      };
    }
    throw new Error("Could not claim order for payment fulfillment");
  }

  for (const item of claimed.items) {
    await Product.updateOne(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
    );
  }

  await Cart.findOneAndUpdate({ sessionId: claimed.sessionId }, { items: [] });

  // Email/logging must never undo a verified paid claim or trigger a second stock decrement.
  try {
    await notifyOrderPaid(claimed);
  } catch (error) {
    console.error(
      "[nttdata/fulfill] post-payment notification failed",
      error instanceof Error ? error.message : "unknown",
    );
    const after = (await Order.findById(claimed._id)) as OrderDocument | null;
    if (after) {
      const note =
        "Payment verified. Order confirmation email could not be completed — contact support if you do not receive email.";
      if (!after.delivery) {
        after.delivery = {
          agencyName: "",
          agencyEmail: "",
          trackingNumber: "",
          notes: "",
        };
      }
      const existing = (after.delivery.notes || "").trim();
      if (!existing.includes(note)) {
        after.delivery.notes = existing ? `${existing} ${note}` : note;
        await after.save();
      }
    }
  }

  const refreshed = (await Order.findById(claimed._id)) as OrderDocument;
  return {
    order: refreshed,
    alreadyPaid: false,
    markedPaid: true,
    markedFailed: false,
    stillPending: false,
  };
}
