"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/app/components/SiteHeader";
import { useCart } from "@/components/CartProvider";
import { formatINR } from "@/lib/commerce-client";
import styles from "./page.module.css";

declare global {
  interface Window {
    AtomPaynetz?: new (
      options: {
        atomTokenId: string;
        merchId: string;
        custEmail: string;
        custMobile: string;
        returnUrl: string;
        merchantLogo?: string;
        bgColor?: string;
      },
      env?: "uat" | "prod",
    ) => unknown;
  }
}

function loadAtomCheckoutScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-nttdata-checkout="1"]`,
    );
    if (existing && window.AtomPaynetz) {
      resolve();
      return;
    }
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load NTT DATA checkout script")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `${src}${src.includes("?") ? "&" : "?"}v=${Date.now()}`;
    script.async = true;
    script.dataset.nttdataCheckout = "1";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load NTT DATA checkout script"));
    document.head.appendChild(script);
  });
}

/** Remove Atom SDK loader / iframe leftovers after a failed open. */
function clearAtomSdkUi() {
  document.getElementById("iFrameAtomLoader")?.remove();
  document.getElementById("atom_jiffy_pay")?.remove();
  const modal = document.getElementById("aipayErrorModal");
  if (modal) modal.style.display = "none";
}

function getCheckoutFrameHttpStatus(): number | undefined {
  const entries = performance.getEntriesByType(
    "resource",
  ) as PerformanceResourceTiming[];
  const hit = [...entries]
    .reverse()
    .find((e) => e.name.includes("checkout-frame.jsp"));
  if (!hit) return undefined;
  const status = (hit as PerformanceResourceTiming & { responseStatus?: number })
    .responseStatus;
  return typeof status === "number" && status > 0 ? status : undefined;
}

function isAtomIframeVisible(): boolean {
  const iframe = document.getElementById(
    "atom_jiffy_pay",
  ) as HTMLIFrameElement | null;
  if (!iframe) return false;
  return getComputedStyle(iframe).display !== "none";
}

function isAtomErrorModalVisible(): boolean {
  const errModal = document.getElementById("aipayErrorModal");
  return Boolean(errModal && getComputedStyle(errModal).display !== "none");
}

/**
 * Atom UAT SDK often leaves `#iFrameAtomLoader` up after a successful frame open
 * (it clears on postMessage "hide" / cancel, not on form submit). Do not treat a
 * lingering loader alone as failure if the checkout iframe is visible.
 */
function watchAtomCheckoutOpen(
  options: { timeoutMs?: number; returnUrlIsLocal?: boolean } = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 20000;
  const returnUrlIsLocal = Boolean(options.returnUrlIsLocal);

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      window.clearInterval(poll);
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      if (err) {
        clearAtomSdkUi();
        reject(err);
      } else {
        // Payment UI is up — leave Atom iframe/loader to the SDK.
        resolve();
      }
    };

    const onMessage = (event: MessageEvent) => {
      if (event.data === "cancelTransaction" || event.data === "sessionTimeout") {
        console.info("[nttdata checkout] sdk_message", {
          code: String(event.data),
        });
        finish(new Error("Payment was cancelled or the session timed out"));
        return;
      }
      if (event.data === "hide") {
        console.info("[nttdata checkout] sdk_message", { code: "hide" });
        finish();
      }
    };

    window.addEventListener("message", onMessage);

    const poll = window.setInterval(() => {
      if (isAtomErrorModalVisible()) {
        const raw =
          document.getElementById("custom-aipay-error-msg")?.textContent ||
          "Payment SDK error";
        const msg = raw.replace(/\s+/g, " ").trim();
        console.info("[nttdata checkout] sdk_error_modal", {
          messageLen: msg.length,
        });
        finish(new Error(msg || "Payment SDK error"));
        return;
      }

      const frameStatus = getCheckoutFrameHttpStatus();
      if (frameStatus === 403) {
        console.info("[nttdata checkout] frame_http", { status: 403 });
        finish(
          new Error(
            returnUrlIsLocal
              ? "Payment page was blocked (HTTP 403). Set NEXT_PUBLIC_APP_URL to a public HTTPS URL (e.g. a tunnel) that is whitelisted with NTT DATA UAT, restart the server, and try again."
              : "Payment page was blocked (HTTP 403). Confirm your return URL domain is whitelisted with NTT DATA UAT, then try again.",
          ),
        );
        return;
      }

      // Frame visible = hosted checkout opened (Atom may still show its loader).
      if (isAtomIframeVisible() && frameStatus !== undefined && frameStatus < 400) {
        console.info("[nttdata checkout] frame_open", { status: frameStatus });
        finish();
      } else if (isAtomIframeVisible() && frameStatus === undefined) {
        // Frame shown; status may be unavailable in some browsers — treat as open.
        console.info("[nttdata checkout] frame_open", { status: "unknown" });
        finish();
      }
    }, 400);

    const timer = window.setTimeout(() => {
      const frameStatus = getCheckoutFrameHttpStatus();
      const iframeVisible = isAtomIframeVisible();
      const loaderPresent = Boolean(
        document.getElementById("iFrameAtomLoader"),
      );
      console.info("[nttdata checkout] open_timeout", {
        frameStatus: frameStatus ?? null,
        iframeVisible,
        loaderPresent,
        returnUrlIsLocal,
      });

      if (frameStatus === 403) {
        finish(
          new Error(
            returnUrlIsLocal
              ? "Payment page was blocked (HTTP 403). Use a public HTTPS NEXT_PUBLIC_APP_URL whitelisted for NTT DATA UAT."
              : "Payment page was blocked (HTTP 403). Confirm return URL whitelist with NTT DATA UAT.",
          ),
        );
        return;
      }

      if (iframeVisible) {
        // Hosted UI is showing; do not fail because Atom left its loader up.
        finish();
        return;
      }

      finish(
        new Error(
          returnUrlIsLocal
            ? "Payment page did not open. Localhost return URLs are often rejected by NTT DATA UAT. Set NEXT_PUBLIC_APP_URL to a public HTTPS tunnel, whitelist that domain with NDPS, restart, and retry."
            : "Payment page did not finish opening. Please try again.",
        ),
      );
    }, timeoutMs);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [localReturnWarning, setLocalReturnWarning] = useState(false);
  const attemptRef = useRef(0);

  useEffect(() => {
    return () => {
      // If the user navigates away mid-open, clear SDK overlays.
      clearAtomSdkUi();
    };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    setLocalReturnWarning(false);
    clearAtomSdkUi();
    setBusy(true);
    const attempt = ++attemptRef.current;

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

      const order = checkoutData.order as { id: string; orderNumber: string };

      const payRes = await fetch("/api/payments/nttdata/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const payData = await payRes.json();
      console.info("[nttdata checkout] initiate", {
        httpStatus: payRes.status,
        fields:
          payData && typeof payData === "object" ? Object.keys(payData) : [],
        hasAtomTokenId: Boolean(payData?.atomTokenId),
        atomTokenIdLen:
          typeof payData?.atomTokenId === "string" ||
          typeof payData?.atomTokenId === "number"
            ? String(payData.atomTokenId).length
            : 0,
        returnUrlIsLocal: Boolean(payData?.returnUrlIsLocal),
        attempt,
      });
      if (!payRes.ok) {
        throw new Error(payData.error || "Payment initiation failed");
      }

      if (payData.alreadyPaid) {
        router.push(`/order/${order.id}`);
        return;
      }

      const returnUrlIsLocal = Boolean(payData.returnUrlIsLocal);
      if (returnUrlIsLocal) {
        setLocalReturnWarning(true);
        console.info("[nttdata checkout] warning", {
          code: "RETURN_URL_LOCALHOST",
        });
      }

      await loadAtomCheckoutScript(String(payData.checkoutJsUrl));
      if (!window.AtomPaynetz) {
        throw new Error("NTT DATA checkout library did not load");
      }

      // Documented required options only (+ empty optionals to avoid bad asset URLs).
      const options = {
        atomTokenId: String(payData.atomTokenId),
        merchId: String(payData.merchId),
        custEmail: String(payData.custEmail),
        custMobile: String(payData.custMobile),
        returnUrl: String(payData.returnUrl),
        merchantLogo: "",
        bgColor: "",
      };

      console.info("[nttdata checkout] AtomPaynetz", {
        optionKeys: Object.keys(options),
        env: "uat",
        atomTokenIdLen: options.atomTokenId.length,
        merchIdLen: options.merchId.length,
        custMobileLen: options.custMobile.length,
        hasMerchantLogo: Boolean(options.merchantLogo),
        returnUrlHost: (() => {
          try {
            return new URL(options.returnUrl).hostname;
          } catch {
            return "invalid";
          }
        })(),
        returnUrlProtocol: (() => {
          try {
            return new URL(options.returnUrl).protocol;
          } catch {
            return "invalid";
          }
        })(),
      });

      new window.AtomPaynetz(options, "uat");

      await watchAtomCheckoutOpen({ returnUrlIsLocal });
    } catch (err) {
      if (attempt === attemptRef.current) {
        setError(err instanceof Error ? err.message : "Checkout failed");
      }
    } finally {
      if (attempt === attemptRef.current) {
        setBusy(false);
      }
    }
  };

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <span className={styles.eyebrow}>Checkout</span>
        <h1 className={styles.title}>Payment details</h1>
        <p className={styles.lead}>
          Enter your delivery details, then pay securely via NTT DATA Payment
          Services (UAT). Your card or UPI details are collected on the hosted
          payment page.
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
              {cart.comboMessage ? (
                <p className={styles.comboNote}>{cart.comboMessage}</p>
              ) : null}
              {cart.comboApplied && cart.comboSavings ? (
                <p className={styles.comboSave}>
                  Combo savings · −{formatINR(cart.comboSavings)}
                </p>
              ) : null}
              <p className={styles.total}>Total · {formatINR(cart.subtotal)}</p>
            </div>

            {localReturnWarning ? (
              <p className={styles.error} role="status">
                Return URL is localhost. NTT DATA UAT usually requires a public
                HTTPS callback URL registered/whitelisted for your merchant.
                Set <code>NEXT_PUBLIC_APP_URL</code> to that URL, restart the
                app, and try again.
              </p>
            ) : null}

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
                Phone (for payment)
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
                <button
                  className={`${styles.btn} ${styles.btnPay}`}
                  type="submit"
                  disabled={busy}
                >
                  {busy ? "Opening payment…" : "Pay now"}
                </button>
                <Link className={`${styles.btn} ${styles.btnGhost}`} href="/cart">
                  Back to cart
                </Link>
              </div>
              <p className={styles.note}>
                Tap Pay now to open the secure NTT DATA UAT payment page. If it
                fails to open, fix the return URL config and try again — each
                attempt requests a fresh payment token.
              </p>
            </form>
          </div>
        ) : null}
      </main>
    </>
  );
}
