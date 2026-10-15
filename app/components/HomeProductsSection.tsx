"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Variants } from "framer-motion";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatINR } from "@/lib/commerce-client";
import type { ProductDTO } from "@/lib/types/commerce";
import styles from "../page.module.css";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const HOME_PRODUCTS = [
  {
    slug: "legends-line",
    title: "The Legends line",
    description:
      "Premium hardcovers with album-art energy. Lined pages for lyrics, riffs, and real ideas.",
    image: "/page1.png",
    fallbackPrice: 65,
    pageStyle: "Lined pages",
  },
  {
    slug: "studio-sketch",
    title: "Studio & sketch",
    description:
      "Lay-flat plain pages for sketches, setlists, and setpiece notes — freeform creator space.",
    image: "/page2.png",
    fallbackPrice: 65,
    pageStyle: "Plain pages",
  },
  {
    slug: "tour-edition",
    title: "Tour edition",
    description:
      "Road-ready durability with lined pages — because ideas don’t wait for a desk.",
    image: "/page3.png",
    fallbackPrice: 65,
    pageStyle: "Lined pages",
  },
  {
    slug: "never-free-never-me",
    title: "Never Free, Never Me",
    description:
      "New CultScribe drop — raw cover energy with lined pages for everyday writing.",
    image: "/cultscribenew.jpeg",
    fallbackPrice: 65,
    pageStyle: "Lined pages",
  },
] as const;

type HomeProductsSectionProps = {
  inViewParent: Variants;
  inViewChild: Variants;
  inViewViewport: {
    once: boolean;
    margin: `${number}px ${number}px ${number}px ${number}px` | string;
    amount: number;
  };
};

export function HomeProductsSection({
  inViewParent,
  inViewChild,
  inViewViewport,
}: HomeProductsSectionProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const reduceMotion = useReducedMotion();
  const [bySlug, setBySlug] = useState<Record<string, ProductDTO>>({});
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [message, setMessage] = useState("");

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
        /* keep fallbacks */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onAdd = async (slug: string) => {
    const product = bySlug[slug];
    if (!product) {
      setMessage("Product not ready yet — open Shop to browse.");
      return;
    }
    setBusySlug(slug);
    setMessage("");
    try {
      await addItem(product.id, 1);
      router.push("/cart");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not add to cart");
      setBusySlug(null);
    }
  };

  const items = useMemo(
    () =>
      HOME_PRODUCTS.map((item, index) => {
        const live = bySlug[item.slug];
        return {
          ...item,
          id: String(index + 1).padStart(2, "0"),
          productId: live?.id,
          price: live?.price ?? item.fallbackPrice,
          stock: live?.stock ?? 0,
          inStock: live ? live.stock > 0 : true,
        };
      }),
    [bySlug],
  );

  return (
    <div className={styles.notebookStrip} id="products">
      <section
        className={styles.section}
        style={{ maxWidth: 1320, margin: "0 auto" }}
        aria-labelledby="products-title"
      >
        <motion.div
          className={styles.sectionHeader}
          variants={inViewParent}
          initial="hidden"
          whileInView="show"
          viewport={inViewViewport}
        >
          <motion.span className={styles.eyebrow} variants={inViewChild}>
            Products
          </motion.span>
          <motion.h2
            id="products-title"
            className={styles.title}
            variants={inViewChild}
          >
            Featured notebooks
          </motion.h2>
          <motion.p className={styles.lead} variants={inViewChild}>
            Featured covers from the CultScribe lineup — including lined and
            plain interiors. Add to cart here, or open the full shop.
          </motion.p>
        </motion.div>

        {message ? (
          <p className={styles.productMessage} role="status">
            {message}
          </p>
        ) : null}

        <motion.div
          className={styles.cards}
          variants={inViewParent}
          initial="hidden"
          whileInView="show"
          viewport={inViewViewport}
        >
          {items.map((item) => (
            <motion.article
              className={styles.card}
              key={item.slug}
              variants={inViewChild}
            >
              <div className={styles.cardCover} aria-hidden>
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="(max-width: 719px) 50vw, (max-width: 1099px) 50vw, 420px"
                  className={styles.cardCoverImg}
                  draggable={false}
                />
                <div className={styles.cardCoverTint} />
                <div className={styles.cardCoverVignette} />
              </div>
              <div className={styles.cardContent}>
                <span className={styles.cardNum}>Series {item.id}</span>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDesc}>{item.description}</p>
                <p className={styles.cardTag}>
                  {formatINR(item.price)} · {item.pageStyle}
                </p>
                <div className={styles.productActions}>
                  <button
                    type="button"
                    className={styles.productAddBtn}
                    aria-label={`Add ${item.title} to cart`}
                    disabled={
                      Boolean(busySlug) ||
                      (Boolean(bySlug[item.slug]) && !item.inStock)
                    }
                    onClick={() => void onAdd(item.slug)}
                  >
                    {busySlug === item.slug ? (
                      "…"
                    ) : bySlug[item.slug] && !item.inStock ? (
                      <>
                        <span className={styles.btnLabelFull}>Sold out</span>
                        <span className={styles.btnLabelShort}>Out</span>
                      </>
                    ) : (
                      <>
                        <span className={styles.btnLabelFull}>Add to cart</span>
                        <span className={styles.btnLabelShort}>Add</span>
                      </>
                    )}
                  </button>
                  <Link className={styles.productShopLink} href="/shop" aria-label="View shop">
                    <span className={styles.btnLabelFull}>View shop</span>
                    <span className={styles.btnLabelShort}>Shop</span>
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          className={styles.productFooter}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{
            duration: reduceMotion ? 0.01 : 0.5,
            ease: EASE_OUT,
          }}
        >
          <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/shop">
            Browse all products
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
