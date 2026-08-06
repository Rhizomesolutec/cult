"use client";

import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";
import { useCart } from "@/components/CartProvider";
import { formatINR } from "@/lib/commerce-client";
import styles from "./page.module.css";

export default function CartPage() {
  const { cart, loading, setQuantity, removeItem } = useCart();

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <span className={styles.eyebrow}>Cart</span>
        <h1 className={styles.title}>Your bag</h1>

        {loading ? <p className={styles.empty}>Loading cart…</p> : null}

        {!loading && cart.items.length === 0 ? (
          <p className={styles.empty}>
            Cart is empty.{" "}
            <Link className={styles.link} href="/shop">
              Browse notebooks
            </Link>
          </p>
        ) : null}

        <div className={styles.list}>
          {cart.items.map((item) => (
            <div key={item.productId} className={styles.row}>
              <div className={styles.thumb}>
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className={styles.thumbImg}
                  sizes="88px"
                />
              </div>
              <div className={styles.meta}>
                <h2>{item.name}</h2>
                <p>
                  {item.series} · {formatINR(item.price)} each
                </p>
                <div className={styles.qty}>
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() =>
                      void setQuantity(item.productId, item.quantity - 1)
                    }
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() =>
                      void setQuantity(item.productId, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => void removeItem(item.productId)}
                >
                  Remove
                </button>
              </div>
              <div className={styles.line}>{formatINR(item.lineTotal)}</div>
            </div>
          ))}
        </div>

        {cart.items.length > 0 ? (
          <div className={styles.footer}>
            <p className={styles.subtotal}>
              Subtotal · {formatINR(cart.subtotal)}
            </p>
            <Link className={styles.btn} href="/checkout">
              Checkout
            </Link>
          </div>
        ) : null}
      </main>
    </>
  );
}
