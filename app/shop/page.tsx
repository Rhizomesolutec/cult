"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/app/components/SiteHeader";
import { useCart } from "@/components/CartProvider";
import { formatINR } from "@/lib/commerce-client";
import type { ProductDTO } from "@/lib/types/commerce";
import styles from "./page.module.css";

export default function ShopPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load products");
        if (!cancelled) setProducts(data.products ?? []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load products");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onAdd = async (productId: string) => {
    setBusyId(productId);
    setMessage("");
    try {
      await addItem(productId, 1);
      router.push("/cart");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not add to cart");
      setBusyId(null);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <span className={styles.eyebrow}>Shop</span>
        <h1 className={styles.title}>Notebooks like album art</h1>
        <p className={styles.lead}>
          Browse the CultScribe collection. Add to cart and checkout via WhatsApp.
        </p>

        {loading ? <p className={styles.status}>Loading products…</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
        {message ? <p className={styles.status}>{message}</p> : null}

        {!loading && !error && products.length === 0 ? (
          <p className={styles.empty}>No products yet.</p>
        ) : null}

        <div className={styles.grid}>
          {products.map((p) => (
            <article key={p.id} className={styles.card}>
              <div className={styles.cover}>
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  className={styles.coverImg}
                  sizes="(max-width: 639px) 50vw, (max-width: 899px) 50vw, 320px"
                />
              </div>
              <div className={styles.body}>
                <span className={styles.series}>{p.series}</span>
                <h2 className={styles.name}>{p.name}</h2>
                <p className={styles.desc}>{p.description}</p>
                <div className={styles.row}>
                  <span className={styles.price}>{formatINR(p.price)}</span>
                  <span className={styles.stock}>
                    {p.stock > 0 ? `${p.stock} in stock` : "Sold out"}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.btn}
                  disabled={p.stock < 1 || busyId === p.id}
                  onClick={() => void onAdd(p.id)}
                >
                  {busyId === p.id ? "Adding…" : "Add to cart"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
