"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/app/components/SiteHeader";
import { formatINR } from "@/lib/commerce-client";
import styles from "./page.module.css";

type OrderView = {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentStatus?: string;
  subtotal: number;
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
  payment?: { provider?: string; demoRef?: string };
  delivery?: {
    agencyName?: string;
    trackingNumber?: string;
  };
};

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${params.id}`, { cache: "no-store" });
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

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <span className={styles.eyebrow}>Confirmation</span>
        <h1 className={styles.title}>
          {order?.status === "paid" ? "Payment complete" : "Order details"}
        </h1>

        {loading ? <p className={styles.status}>Loading…</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        {order ? (
          <div className={styles.card}>
            <h2>{order.orderNumber}</h2>
            <div className={styles.meta}>
              <div>
                Payment: <strong>{order.status.replace("_", " ")}</strong>
              </div>
              <div>
                Fulfillment:{" "}
                <strong>
                  {(order.fulfillmentStatus || "awaiting_payment").replace(
                    "_",
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
            <p className={styles.total}>Total · {formatINR(order.subtotal)}</p>
          </div>
        ) : null}

        <div className={styles.actions}>
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
