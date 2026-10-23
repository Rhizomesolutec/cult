"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/app/components/SiteHeader";
import { useCart } from "@/components/CartProvider";
import { staticCatalog } from "@/lib/catalog";
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
  onAdd: () => void;
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
          disabled={product.stock < 1 || busyId === product.slug}
          onClick={onAdd}
        >
          {busyId === product.slug ? "Adding…" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}

export default function ShopPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const [products, setProducts] = useState<ProductDTO[]>(() => staticCatalog());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ShopFilter>("normal");

  useEffect(() => {
    router.prefetch("/cart");
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (!res.ok || cancelled) return;
        setProducts(data.products ?? []);
      } catch {
        /* static catalog stays on screen */
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

  const onAdd = (product: ProductDTO) => {
    if (busyId) return;
    setBusyId(product.slug);
    const mongoId = /^[a-f0-9]{24}$/i.test(product.id) ? product.id : undefined;
    void addItem({
      productId: mongoId,
      slug: product.slug,
      snapshot: {
        name: product.name,
        series: product.series,
        image: product.image,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        currency: product.currency,
        stock: product.stock,
        size: product.size,
        specialEdition: product.specialEdition,
      },
    });
    router.push("/cart");
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

        {products.length === 0 ? (
          <p className={styles.empty}>No products yet.</p>
        ) : null}

        {products.length > 0 ? (
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
                    key={p.slug}
                    product={p}
                    busyId={busyId}
                    onAdd={() => onAdd(p)}
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
