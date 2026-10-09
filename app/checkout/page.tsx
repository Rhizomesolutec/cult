"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { SiteHeader } from "@/app/components/SiteHeader";
import {
  WHATSAPP_DISPLAY,
  buildCheckoutWhatsAppMessage,
  whatsAppUrl,
} from "@/app/config/whatsapp";
import { useCart } from "@/components/CartProvider";
import { formatINR } from "@/lib/commerce-client";
import styles from "./page.module.css";

export default function CheckoutPage() {
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

      const order = checkoutData.order as {
        orderNumber: string;
        subtotal: number;
      };

      const message = buildCheckoutWhatsAppMessage({
        orderNumber: order.orderNumber,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        items: cart.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
        subtotal: order.subtotal,
      });

      await fetch("/api/cart", { method: "DELETE" });
      await refresh();

      window.location.href = whatsAppUrl(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
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
          Enter your delivery details, then pay via WhatsApp. You&apos;ll be
          redirected to chat with us at {WHATSAPP_DISPLAY} to confirm payment
          and delivery.
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
                Phone (WhatsApp)
              </label>
              <input
                id="phone"
                className={styles.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                required
                inputMode="tel"
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
                <button className={`${styles.btn} ${styles.btnPay}`} type="submit" disabled={busy}>
                  {busy ? "Opening WhatsApp…" : "Pay now"}
                </button>
                <Link className={`${styles.btn} ${styles.btnGhost}`} href="/cart">
                  Back to cart
                </Link>
              </div>
              <p className={styles.note}>
                Tap Pay now to send your order to WhatsApp. We&apos;ll confirm
                payment and delivery details with you there.
              </p>
            </form>
          </div>
        ) : null}
      </main>
    </>
  );
}
