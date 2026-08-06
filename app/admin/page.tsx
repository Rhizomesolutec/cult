"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "./AdminShell";
import { formatINR } from "@/lib/commerce-client";
import styles from "./admin.module.css";

type ProductRow = { id: string; name: string; stock: number; active: boolean };
type OrderRow = {
  id: string;
  status: string;
  subtotal: number;
  customer: { name: string };
};

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pRes, oRes] = await Promise.all([
          fetch("/api/admin/products", { cache: "no-store" }),
          fetch("/api/admin/orders", { cache: "no-store" }),
        ]);
        const pData = await pRes.json();
        const oData = await oRes.json();
        if (!pRes.ok) throw new Error(pData.error || "Failed to load products");
        if (!oRes.ok) throw new Error(oData.error || "Failed to load orders");
        if (!cancelled) {
          setProducts(pData.products ?? []);
          setOrders(oData.orders ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load dashboard");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const paid = orders.filter((o) => o.status === "paid");
  const revenue = paid.reduce((sum, o) => sum + o.subtotal, 0);

  return (
    <AdminShell>
      <h1 className={styles.pageTitle}>Dashboard</h1>
      <p className={styles.pageLead}>
        Manage CultScribe products and review customer purchases.
      </p>
      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.gridStats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Products</span>
          <div className={styles.statValue}>{products.length}</div>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Orders</span>
          <div className={styles.statValue}>{orders.length}</div>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Paid orders</span>
          <div className={styles.statValue}>{paid.length}</div>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Revenue (paid)</span>
          <div className={styles.statValue}>{formatINR(revenue)}</div>
        </div>
      </div>

      <div className={styles.links}>
        <Link className={styles.btn} href="/admin/products">
          Add / manage products
        </Link>
        <Link className={`${styles.btn} ${styles.btnGhost}`} href="/admin/orders">
          View purchases
        </Link>
      </div>
    </AdminShell>
  );
}
