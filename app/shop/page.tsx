"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/app/components/SiteHeader";
import { useCart } from "@/components/CartProvider";
import {
  NOTEBOOK_SPECS,
  notebookSpecsLine,
} from "@/lib/config/notebook-designs";
import { formatINR } from "@/lib/commerce-client";
import type { ProductDTO } from "@/lib/types/commerce";
import styles from "./page.module.css";

function ProductCard({
  product,
  busyId,
  onAdd,
}: {
  product: ProductDTO;
  busyId: string | null;
  onAdd: (productId: string) => void;
}) {
  return (
    <article className={styles.card}>
      <div className={styles.cover}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          className={styles.coverImg}
          sizes="(max-width: 639px) 50vw, (max-width: 899px) 50vw, 320px"
        />
      </div>
      <div className={styles.body}>
        <span className={styles.series}>{product.series}</span>
        <h2 className={styles.name}>{product.name}</h2>
        <p className={styles.specsMeta}>{notebookSpecsLine(true)}</p>
        <p className={styles.desc}>{product.description}</p>
        <div className={styles.row}>
          <span className={styles.price}>{formatINR(product.price)}</span>
          <span className={styles.stock}>
            {product.stock > 0 ? `${product.stock} in stock` : "Sold out"}
          </span>
        </div>
        <button
          type="button"
          className={styles.btn}
          disabled={product.stock < 1 || busyId === product.id}
          onClick={() => onAdd(product.id)}
        >
          {busyId === product.id ? "Adding…" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}

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

  const { normalProducts, a4Products } = useMemo(() => {
    const normal: ProductDTO[] = [];
    const a4: ProductDTO[] = [];
    for (const p of products) {
      if (p.size === "a4" || p.slug.endsWith("-a4")) a4.push(p);
      else normal.push(p);
    }
    return { normalProducts: normal, a4Products: a4 };
  }, [products]);

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
          Browse the CultScribe collection — {NOTEBOOK_SPECS.pages} pages,{" "}
          {NOTEBOOK_SPECS.gsm} GSM, {NOTEBOOK_SPECS.paper} paper. Normal sizes
          first, then A4.
        </p>

        {loading ? <p className={styles.status}>Loading products…</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
        {message ? <p className={styles.status}>{message}</p> : null}

        {!loading && !error && products.length === 0 ? (
          <p className={styles.empty}>No products yet.</p>
        ) : null}

        {normalProducts.length > 0 ? (
          <section
            className={styles.sizeSection}
            aria-labelledby="shop-normal-title"
          >
            <header className={styles.sizeHeader}>
              <h2 id="shop-normal-title" className={styles.sizeTitle}>
                Normal notebooks
              </h2>
              <p className={styles.sizeLead}>
                Standard size — {normalProducts.length} designs
              </p>
            </header>
            <div className={styles.grid}>
              {normalProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  busyId={busyId}
                  onAdd={(id) => void onAdd(id)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {a4Products.length > 0 ? (
          <section
            className={styles.sizeSection}
            aria-labelledby="shop-a4-title"
          >
            <header className={styles.sizeHeader}>
              <h2 id="shop-a4-title" className={styles.sizeTitle}>
                A4 notebooks
              </h2>
              <p className={styles.sizeLead}>
                Larger format — {a4Products.length} designs
              </p>
            </header>
            <div className={styles.grid}>
              {a4Products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  busyId={busyId}
                  onAdd={(id) => void onAdd(id)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
