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
import { PriceTag } from "@/app/components/PriceTag";
import {
  COMBO_PACK_PRICE,
  COMBO_PACK_SIZE,
  NORMAL_PRICE,
} from "@/lib/pricing";
import { formatINR } from "@/lib/commerce-client";
import type { ProductDTO } from "@/lib/types/commerce";
import styles from "./page.module.css";

type ShopFilter = "normal" | "special" | "a4";

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
          <span className={styles.price}>
            <PriceTag
              price={product.price}
              compareAt={product.compareAtPrice}
            />
          </span>
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
  const [filter, setFilter] = useState<ShopFilter>("normal");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/products");
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

  const { normalProducts, specialProducts, a4Products } = useMemo(() => {
    const normal: ProductDTO[] = [];
    const special: ProductDTO[] = [];
    const a4: ProductDTO[] = [];
    for (const p of products) {
      const isA4 = p.size === "a4" || p.slug.endsWith("-a4");
      // Special Edition is normal-only — hide any leftover A4 SKUs.
      if (p.slug.endsWith("-unruled")) continue;
      if (p.specialEdition && isA4) continue;
      if (isA4) {
        a4.push(p);
        continue;
      }
      if (p.specialEdition) special.push(p);
      else normal.push(p);
    }
    return {
      normalProducts: normal,
      specialProducts: special,
      a4Products: a4,
    };
  }, [products]);

  const filtered = useMemo(() => {
    if (filter === "special") return specialProducts;
    if (filter === "a4") return a4Products;
    return normalProducts;
  }, [filter, normalProducts, specialProducts, a4Products]);

  const filterMeta: Record<
    ShopFilter,
    { title: string; lead: string; count: number }
  > = {
    normal: {
      title: "Normal notebooks",
      lead: "Standard size — combo packs apply here",
      count: normalProducts.length,
    },
    special: {
      title: "Special notebooks",
      lead: "Special Edition · normal size only",
      count: specialProducts.length,
    },
    a4: {
      title: "A4 notebooks",
      lead: "Larger format — not included in combo packs",
      count: a4Products.length,
    },
  };

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
          {NOTEBOOK_SPECS.gsm} GSM, {NOTEBOOK_SPECS.paper} paper. Normal books
          from {formatINR(NORMAL_PRICE)}. Combo: every {COMBO_PACK_SIZE} normal
          notebooks for {formatINR(COMBO_PACK_PRICE)} (Special Edition &amp; A4
          excluded).
        </p>

        <div
          className={styles.filters}
          role="tablist"
          aria-label="Shop category"
        >
          {(
            [
              ["normal", "Normal notebook"],
              ["special", "Special notebook"],
              ["a4", "A4"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              className={
                filter === key ? styles.filterActive : styles.filterBtn
              }
              onClick={() => setFilter(key)}
            >
              {label}
              <span className={styles.filterCount}>
                {key === "normal"
                  ? normalProducts.length
                  : key === "special"
                    ? specialProducts.length
                    : a4Products.length}
              </span>
            </button>
          ))}
        </div>

        {loading ? <p className={styles.status}>Loading products…</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
        {message ? <p className={styles.status}>{message}</p> : null}

        {!loading && !error && products.length === 0 ? (
          <p className={styles.empty}>No products yet.</p>
        ) : null}

        {!loading && !error && products.length > 0 ? (
          <section
            className={styles.sizeSection}
            aria-labelledby="shop-filter-title"
          >
            <header className={styles.sizeHeader}>
              <h2 id="shop-filter-title" className={styles.sizeTitle}>
                {filterMeta[filter].title}
              </h2>
              <p className={styles.sizeLead}>
                {filterMeta[filter].lead} — {filterMeta[filter].count} designs
              </p>
            </header>
            {filtered.length > 0 ? (
              <div className={styles.grid}>
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    busyId={busyId}
                    onAdd={(id) => void onAdd(id)}
                  />
                ))}
              </div>
            ) : (
              <p className={styles.empty}>
                No products in this category right now.
              </p>
            )}
          </section>
        ) : null}
      </main>
    </>
  );
}
