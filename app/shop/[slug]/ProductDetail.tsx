"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/app/components/SiteHeader";
import { useCart } from "@/components/CartProvider";
import {
  NOTEBOOK_SPECS,
  PAPER_FEATURES,
  PAPER_INTRO,
  notebookSpecsLine,
  pageStyleLabel,
  sizeLabel,
  type NotebookDesignConfig,
  type NotebookSize,
} from "@/lib/config/notebook-designs";
import { PriceTag } from "@/app/components/PriceTag";
import {
  NORMAL_COMPARE_AT,
  NORMAL_PRICE,
  SPECIAL_EDITION_PRICE,
} from "@/lib/pricing";
import type { ProductDTO } from "@/lib/types/commerce";
import styles from "./page.module.css";

type ProductDetailProps = {
  design: NotebookDesignConfig;
  initialSize: NotebookSize;
};

export function ProductDetail({ design, initialSize }: ProductDetailProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [bySlug, setBySlug] = useState<Record<string, ProductDTO>>({});
  const [size, setSize] = useState<NotebookSize>(initialSize);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [featuresOpen, setFeaturesOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { products: ProductDTO[] };
        if (cancelled) return;
        const map: Record<string, ProductDTO> = {};
        for (const p of data.products ?? []) map[p.slug] = p;
        setBySlug(map);
      } catch {
        /* static fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableSizes: NotebookSize[] = design.specialEdition
    ? ["normal"]
    : ["normal", "a4"];

  const activeSize = availableSizes.includes(size) ? size : "normal";
  const product =
    bySlug[activeSize === "normal" ? design.normalSlug : design.a4Slug];

  const fallbackPrice = design.specialEdition
    ? SPECIAL_EDITION_PRICE
    : NORMAL_PRICE;
  const compareAt = design.specialEdition
    ? null
    : (product?.compareAtPrice ?? NORMAL_COMPARE_AT);

  const onAdd = async () => {
    if (!product) {
      setMessage("Loading products — please try again.");
      return;
    }
    if (product.stock < 1) {
      setMessage("That size is sold out.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await addItem(product.id, 1);
      router.push("/cart");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not add to cart");
      setBusy(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <Link href="/shop" className={styles.back}>
          ← Back to shop
        </Link>

        <div className={styles.layout}>
          <div className={styles.cover}>
            <Image
              src={design.image}
              alt={design.name}
              fill
              className={styles.coverImg}
              sizes="(max-width: 767px) 100vw, 480px"
              priority
            />
          </div>

          <div className={styles.details}>
            <span className={styles.series}>
              {design.series}
              {design.specialEdition ? " · Special" : ""}
            </span>
            <h1 className={styles.title}>{design.name}</h1>
            <p className={styles.subtitle}>{design.subtitle}</p>

            <dl className={styles.specs}>
              <div className={styles.specItem}>
                <dt className={styles.specLabel}>Pages</dt>
                <dd className={styles.specValue}>{NOTEBOOK_SPECS.pages}</dd>
              </div>
              <div className={styles.specItem}>
                <dt className={styles.specLabel}>Ruling</dt>
                <dd className={styles.specValue}>
                  {pageStyleLabel(design.pageStyle)}
                </dd>
              </div>
              <div className={styles.specItem}>
                <dt className={styles.specLabel}>Paper</dt>
                <dd className={styles.specValue}>{NOTEBOOK_SPECS.gsm} GSM</dd>
              </div>
              <div className={styles.specItemWide}>
                <dt className={styles.specLabel}>Stock</dt>
                <dd className={styles.specValue}>{NOTEBOOK_SPECS.paper}</dd>
              </div>
            </dl>

            <p className={styles.pageCallout}>
              This notebook has{" "}
              <strong>
                {design.pageStyle === "lined" ? "lined pages" : "plain pages"}
              </strong>
              . {notebookSpecsLine(design, true)}.
            </p>

            <p className={styles.desc}>{design.description}</p>

            <section className={styles.paperBlock} aria-labelledby="paper-title">
              <h2 id="paper-title" className={styles.paperTitle}>
                Andhra TruPrint Ultra (HB)
              </h2>
              <p className={styles.paperIntro}>{PAPER_INTRO}</p>

              <div className={styles.accordion}>
                <button
                  type="button"
                  className={styles.accordionBtn}
                  aria-expanded={featuresOpen}
                  onClick={() => setFeaturesOpen((o) => !o)}
                >
                  <span>Features</span>
                  <span className={styles.accordionIcon} aria-hidden>
                    {featuresOpen ? "−" : "+"}
                  </span>
                </button>
                {featuresOpen ? (
                  <ul className={styles.featureList}>
                    {PAPER_FEATURES.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>

            {availableSizes.length > 1 ? (
              <div
                className={styles.sizes}
                role="group"
                aria-label={`${design.name} size`}
              >
                {availableSizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={
                      activeSize === s ? styles.sizeActive : styles.sizeBtn
                    }
                    aria-pressed={activeSize === s}
                    onClick={() => {
                      setSize(s);
                      setMessage("");
                    }}
                  >
                    {sizeLabel(s)}
                  </button>
                ))}
              </div>
            ) : (
              <p className={styles.pageCallout}>
                <strong>Normal size only</strong> — Special Edition does not
                include A4.
              </p>
            )}

            <div className={styles.row}>
              <span className={styles.price}>
                <PriceTag
                  price={product?.price ?? fallbackPrice}
                  compareAt={compareAt}
                />
              </span>
              <span className={styles.stock}>
                {product
                  ? product.stock > 0
                    ? `${product.stock} in stock`
                    : "Sold out"
                  : "Checking stock…"}
              </span>
            </div>

            {message ? (
              <p className={styles.message} role="status">
                {message}
              </p>
            ) : null}

            <button
              type="button"
              className={styles.btn}
              disabled={busy || (product != null && product.stock < 1)}
              onClick={() => void onAdd()}
            >
              {busy
                ? "Adding…"
                : product && product.stock < 1
                  ? "Sold out"
                  : "Add to cart"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
