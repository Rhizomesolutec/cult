"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/app/components/SiteHeader";
import { useCart } from "@/components/CartProvider";
import { formatINR } from "@/lib/commerce-client";
import styles from "./page.module.css";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading, refresh } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          address,
          city,
          pincode,
        }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error || "Checkout failed");
      }

      const payRes = await fetch("/api/payments/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: checkoutData.order.id,
          outcome: "success",
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) {
        throw new Error(payData.error || "Demo payment failed");
      }

      await refresh();
      router.push(`/order/${checkoutData.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <span className={styles.eyebrow}>Checkout</span>
        <h1 className={styles.title}>Payment details</h1>
        <p className={styles.lead}>
          Enter delivery details and complete payment. Demo gateway for now —
          SMTP confirmation emails run when configured.
        </p>

        {loading ? <p className={styles.lead}>Loading…</p> : null}

        {!loading && cart.items.length === 0 ? (
          <p className={styles.lead}>
            Nothing to checkout.{" "}
            <Link className={styles.link} href="/shop">
              Go to shop
            </Link>
          </p>
        ) : null}

        {cart.items.length > 0 ? (
          <div className={styles.panelLight}>
            <div className={styles.summary}>
              <h2>Order summary</h2>
              <ul>
                {cart.items.map((i) => (
                  <li key={i.productId}>
                    <span>
                      {i.name} × {i.quantity}
                    </span>
                    <span>{formatINR(i.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <p className={styles.total}>Total · {formatINR(cart.subtotal)}</p>
            </div>

            {error ? <p className={styles.error}>{error}</p> : null}

            <form className={styles.form} onSubmit={(e) => void onSubmit(e)}>
              <label className={styles.label} htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />

              <label className={styles.label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <label className={styles.label} htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                className={styles.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />

              <label className={styles.label} htmlFor="address">
                Address
              </label>
              <textarea
                id="address"
                className={styles.textarea}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete="street-address"
                required
              />

              <label className={styles.label} htmlFor="city">
                City
              </label>
              <input
                id="city"
                className={styles.input}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                required
              />

              <label className={styles.label} htmlFor="pincode">
                Pincode
              </label>
              <input
                id="pincode"
                className={styles.input}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                autoComplete="postal-code"
                required
              />

              <div className={styles.actions}>
                <button className={styles.btn} type="submit" disabled={busy}>
                  {busy ? "Processing…" : "Pay with demo gateway"}
                </button>
                <Link className={`${styles.btn} ${styles.btnGhost}`} href="/cart">
                  Back to cart
                </Link>
              </div>
              <p className={styles.note}>
                After payment we store the order in MongoDB and queue customer +
                delivery-agency emails (see{" "}
                <code>docs/EMAIL_SETUP.md</code>).
              </p>
            </form>
          </div>
        ) : null}
      </main>
    </>
  );
}
