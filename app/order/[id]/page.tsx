"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/app/components/SiteHeader";
import { formatINR } from "@/lib/commerce-client";
import styles from "./page.module.css";

type OrderView = {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentStatus?: string;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  currency: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    pincode?: string;
  };
  items: {
    name: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  payment?: {
    provider?: string;
    demoRef?: string;
    merchTxnId?: string;
    atomTxnId?: string;
    bankTxnId?: string;
    gatewayPaymentId?: string;
    lastStatusCode?: string;
    lastStatusMessage?: string;
  };
  delivery?: {
    agencyName?: string;
    trackingNumber?: string;
    notes?: string;
  };
};

function titleForStatus(status: string | undefined) {
  if (status === "paid") return "Payment complete";
  if (status === "failed" || status === "cancelled") return "Payment failed";
  if (status === "pending_payment") return "Payment pending";
  return "Order details";
}

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    if (!params?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${params.id}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load order");
        if (!cancelled) setOrder(data.order);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load order");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params?.id]);

  const checkPaymentStatus = async () => {
    if (!params?.id) return;
    setChecking(true);
    setStatusMsg("");
    setError("");
    try {
      const res = await fetch("/api/payments/nttdata/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: params.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status check failed");

      const orderRes = await fetch(`/api/orders/${params.id}`, {
        cache: "no-store",
      });
      const orderData = await orderRes.json();
      if (orderRes.ok) setOrder(orderData.order);

      if (data.order?.status === "paid") {
        setStatusMsg("Payment confirmed.");
      } else if (data.order?.status === "failed") {
        setStatusMsg("Payment was not successful.");
      } else {
        setStatusMsg(
          data.order?.payment?.lastStatusMessage ||
            "Payment is still pending. Try again shortly.",
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status check failed");
    } finally {
      setChecking(false);
    }
  };

  const retryPayment = () => {
    router.push("/checkout");
  };

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <span className={styles.eyebrow}>Confirmation</span>
        <h1 className={styles.title}>{titleForStatus(order?.status)}</h1>

        {order?.status === "pending_payment" ? (
          <p className={styles.status}>
            Your order is reserved while we wait for payment confirmation from
            NTT DATA. You can refresh the status below if you already paid.
          </p>
        ) : null}
        {order?.status === "failed" || order?.status === "cancelled" ? (
          <p className={styles.status}>
            Payment did not complete. You can return to checkout and try again.
          </p>
        ) : null}
        {order?.status === "paid" ? (
          <p className={styles.status}>
            Thanks — we&apos;ve received your payment and will process your
            order.
          </p>
        ) : null}

        {loading ? <p className={styles.status}>Loading…</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
        {statusMsg ? <p className={styles.status}>{statusMsg}</p> : null}

        {order ? (
          <div className={styles.card}>
            <h2>{order.orderNumber}</h2>
            <div className={styles.meta}>
              <div>
                Payment:{" "}
                <strong>{order.status.replace(/_/g, " ")}</strong>
              </div>
              <div>
                Fulfillment:{" "}
                <strong>
                  {(order.fulfillmentStatus || "awaiting_payment").replace(
                    /_/g,
                    " ",
                  )}
                </strong>
              </div>
              <div>
                Customer: <strong>{order.customer.name}</strong> (
                {order.customer.email})
              </div>
              {order.customer.phone ? (
                <div>
                  Phone: <strong>{order.customer.phone}</strong>
                </div>
              ) : null}
              {(order.customer.address ||
                order.customer.city ||
                order.customer.pincode) && (
                <div>
                  Delivery:{" "}
                  <strong>
                    {[
                      order.customer.address,
                      order.customer.city,
                      order.customer.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </strong>
                </div>
              )}
              {order.payment?.merchTxnId ? (
                <div>
                  Merchant txn: <strong>{order.payment.merchTxnId}</strong>
                </div>
              ) : null}
              {order.payment?.atomTxnId || order.payment?.gatewayPaymentId ? (
                <div>
                  Gateway txn:{" "}
                  <strong>
                    {order.payment.atomTxnId || order.payment.gatewayPaymentId}
                  </strong>
                </div>
              ) : null}
              {order.payment?.lastStatusCode ? (
                <div>
                  Gateway status:{" "}
                  <strong>{order.payment.lastStatusCode}</strong>
                  {order.payment.lastStatusMessage
                    ? ` — ${order.payment.lastStatusMessage}`
                    : ""}
                </div>
              ) : null}
              {order.payment?.demoRef ? (
                <div>
                  Payment ref: <strong>{order.payment.demoRef}</strong>
                </div>
              ) : null}
              {order.delivery?.trackingNumber ? (
                <div>
                  Tracking: <strong>{order.delivery.trackingNumber}</strong>
                </div>
              ) : null}
              {order.delivery?.notes ? (
                <div>
                  Notice: <strong>{order.delivery.notes}</strong>
                </div>
              ) : null}
            </div>
            <ul className={styles.list}>
              {order.items.map((item, idx) => (
                <li key={`${item.name}-${idx}`}>
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatINR(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <p className={styles.total}>
              Books · {formatINR(order.subtotal)}
            </p>
            <p className={styles.total}>
              Delivery · {formatINR(order.deliveryCharge)}
            </p>
            <p className={styles.total}>Total · {formatINR(order.total)}</p>
          </div>
        ) : null}

        <div className={styles.actions}>
          {order?.status === "pending_payment" ? (
            <button
              type="button"
              className={styles.btn}
              disabled={checking}
              onClick={() => void checkPaymentStatus()}
            >
              {checking ? "Checking…" : "Check payment status"}
            </button>
          ) : null}
          {order?.status === "failed" || order?.status === "cancelled" ? (
            <button
              type="button"
              className={styles.btn}
              disabled={checking}
              onClick={retryPayment}
            >
              Try checkout again
            </button>
          ) : null}
          <Link className={styles.btn} href="/shop">
            Continue shopping
          </Link>
          <Link className={`${styles.btn} ${styles.btnGhost}`} href="/">
            Home
          </Link>
        </div>
      </main>
    </>
  );
}
