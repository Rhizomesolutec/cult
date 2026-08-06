"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "../AdminShell";
import { formatINR } from "@/lib/commerce-client";
import styles from "../admin.module.css";

type OrderView = {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentStatus: string;
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
  payment?: {
    provider?: string;
    demoRef?: string;
    gatewayPaymentId?: string;
    paidAt?: string;
  };
  delivery?: {
    agencyName?: string;
    agencyEmail?: string;
    trackingNumber?: string;
    notes?: string;
    dispatchedAt?: string;
    deliveredAt?: string;
  };
  emailLog?: {
    type: string;
    to: string;
    subject: string;
    status: string;
    error?: string;
    sentAt?: string;
  }[];
  createdAt?: string;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<
      string,
      { agencyName: string; agencyEmail: string; trackingNumber: string; notes: string }
    >
  >({});

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/orders", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load orders");
    const list = (data.orders ?? []) as OrderView[];
    setOrders(list);
    const next: typeof drafts = {};
    for (const o of list) {
      next[o.id] = {
        agencyName: o.delivery?.agencyName || "",
        agencyEmail: o.delivery?.agencyEmail || "",
        trackingNumber: o.delivery?.trackingNumber || "",
        notes: o.delivery?.notes || "",
      };
    }
    setDrafts(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load orders");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const updateOrder = async (
    id: string,
    body: Record<string, string | undefined>,
  ) => {
    setBusyId(id);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setSuccess(`Updated ${data.order.orderNumber}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell>
      <h1 className={styles.pageTitle}>Purchases</h1>
      <p className={styles.pageLead}>
        Live MongoDB order records — customer delivery details, payment,
        fulfillment, and email log. Mark shipped / delivered to trigger SMTP
        mails when configured.
      </p>

      {loading ? <p className={styles.muted}>Loading purchases…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {success ? <p className={styles.success}>{success}</p> : null}

      {!loading && orders.length === 0 ? (
        <p className={styles.muted}>No purchases in the database yet.</p>
      ) : null}

      {orders.map((order) => {
        const draft = drafts[order.id] || {
          agencyName: "",
          agencyEmail: "",
          trackingNumber: "",
          notes: "",
        };
        return (
          <article key={order.id} className={styles.orderBlock}>
            <div className={styles.orderHead}>
              <div>
                <strong>{order.orderNumber}</strong>
                <div className={styles.muted}>
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString("en-IN")
                    : "—"}
                </div>
              </div>
              <div className={styles.actions}>
                <span
                  className={`${styles.badge} ${
                    order.status === "paid" ? styles.badgePaid : styles.badgePending
                  }`}
                >
                  pay: {order.status.replace("_", " ")}
                </span>
                <span className={styles.badge}>
                  ship: {order.fulfillmentStatus.replace("_", " ")}
                </span>
              </div>
            </div>

            <div className={styles.orderMeta}>
              <div>
                Customer: <strong>{order.customer.name}</strong>
              </div>
              <div>
                Email: <strong>{order.customer.email}</strong>
              </div>
              {order.customer.phone ? (
                <div>
                  Phone: <strong>{order.customer.phone}</strong>
                </div>
              ) : null}
              <div>
                Address:{" "}
                <strong>
                  {[
                    order.customer.address,
                    order.customer.city,
                    order.customer.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </strong>
              </div>
              <div>
                Payment provider:{" "}
                <strong>{order.payment?.provider || "—"}</strong>
                {order.payment?.demoRef || order.payment?.gatewayPaymentId
                  ? ` · ref ${order.payment.demoRef || order.payment.gatewayPaymentId}`
                  : ""}
              </div>
              {order.payment?.paidAt ? (
                <div>
                  Paid at:{" "}
                  <strong>
                    {new Date(order.payment.paidAt).toLocaleString("en-IN")}
                  </strong>
                </div>
              ) : null}
            </div>

            <ul className={styles.itemList}>
              {order.items.map((item, idx) => (
                <li key={`${order.id}-${idx}`}>
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatINR(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <p style={{ margin: "0.75rem 0 1rem", fontWeight: 600 }}>
              Total · {formatINR(order.subtotal)}
            </p>

            <div className={styles.form} style={{ marginBottom: "1rem" }}>
              <div className={styles.formRow}>
                <div>
                  <label className={styles.label}>Agency name</label>
                  <input
                    className={styles.input}
                    value={draft.agencyName}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [order.id]: { ...draft, agencyName: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={styles.label}>Agency email</label>
                  <input
                    className={styles.input}
                    value={draft.agencyEmail}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [order.id]: { ...draft, agencyEmail: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div>
                  <label className={styles.label}>Tracking number</label>
                  <input
                    className={styles.input}
                    value={draft.trackingNumber}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [order.id]: {
                          ...draft,
                          trackingNumber: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={styles.label}>Delivery notes</label>
                  <input
                    className={styles.input}
                    value={draft.notes}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [order.id]: { ...draft, notes: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  disabled={busyId === order.id}
                  onClick={() =>
                    void updateOrder(order.id, {
                      ...draft,
                    })
                  }
                >
                  Save delivery fields
                </button>
                <button
                  type="button"
                  className={styles.btn}
                  disabled={busyId === order.id || order.status !== "paid"}
                  onClick={() =>
                    void updateOrder(order.id, {
                      ...draft,
                      fulfillmentStatus: "shipped",
                    })
                  }
                >
                  Mark shipped + email
                </button>
                <button
                  type="button"
                  className={styles.btn}
                  disabled={busyId === order.id || order.status !== "paid"}
                  onClick={() =>
                    void updateOrder(order.id, {
                      ...draft,
                      fulfillmentStatus: "delivered",
                    })
                  }
                >
                  Mark delivered + email
                </button>
              </div>
            </div>

            <div>
              <strong style={{ fontSize: "0.75rem", letterSpacing: "0.12em" }}>
                EMAIL LOG (DB)
              </strong>
              {(order.emailLog?.length ?? 0) === 0 ? (
                <p className={styles.muted}>No emails logged yet.</p>
              ) : (
                <ul className={styles.itemList}>
                  {order.emailLog?.map((log, idx) => (
                    <li key={`${order.id}-mail-${idx}`}>
                      <span>
                        {log.type} → {log.to || "(none)"} · {log.status}
                        {log.error ? ` (${log.error})` : ""}
                      </span>
                      <span>
                        {log.sentAt
                          ? new Date(log.sentAt).toLocaleString("en-IN")
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        );
      })}
    </AdminShell>
  );
}
