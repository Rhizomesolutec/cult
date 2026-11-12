"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/app/components/SiteHeader";
import {
  buildCheckoutWhatsAppMessage,
  whatsAppUrl,
} from "@/app/config/whatsapp";
import { useCart } from "@/components/CartProvider";
import { formatINR } from "@/lib/commerce-client";
import styles from "./page.module.css";

/** NTT DATA Atom UAT only on local hosts; live site uses WhatsApp shopping. */
function isLocalNttHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

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

const LOCAL_CHECKOUT_JS = "/payments/nttdata/atomcheckout-uat.js";

function removeFailedCheckoutScripts() {
  document
    .querySelectorAll<HTMLScriptElement>(`script[data-nttdata-checkout="1"]`)
    .forEach((node) => {
      if (!window.AtomPaynetz) node.remove();
    });
}

function loadAtomCheckoutScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.AtomPaynetz) {
      resolve();
      return;
    }

    // Reuse an in-flight script tag so the CDN is not requested twice.
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-nttdata-checkout="1"][data-src-base="${CSS.escape(src)}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.AtomPaynetz) resolve();
        else reject(new Error("NTT DATA checkout library did not initialize"));
      }, { once: true });
      existing.addEventListener(
        "error",
        () =>
          reject(
            new Error(
              `Failed to load NTT DATA checkout script from ${
                src.startsWith("/") ? "local fallback" : "UAT CDN"
              }`,
            ),
          ),
        { once: true },
      );
      return;
    }

    removeFailedCheckoutScripts();

    const script = document.createElement("script");
    const withCacheBust = `${src}${src.includes("?") ? "&" : "?"}v=${Date.now()}`;
    script.src = withCacheBust;
    script.async = true;
    script.dataset.nttdataCheckout = "1";
    script.dataset.srcBase = src;
    script.onload = () => {
      if (window.AtomPaynetz) resolve();
      else {
        script.remove();
        reject(new Error("NTT DATA checkout library did not initialize"));
      }
    };
    script.onerror = () => {
      script.remove();
      reject(
        new Error(
          `Failed to load NTT DATA checkout script from ${
            src.startsWith("/") ? "local fallback" : "UAT CDN"
          }`,
        ),
      );
    };
    document.head.appendChild(script);
  });
}

async function loadAtomCheckoutScript(src: string): Promise<void> {
  const candidates = [src];
  if (src !== LOCAL_CHECKOUT_JS) {
    candidates.push(LOCAL_CHECKOUT_JS);
  }

  let lastError: Error | null = null;
  for (const candidate of candidates) {
    try {
      await loadAtomCheckoutScriptOnce(candidate);
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw (
    lastError ||
    new Error(
      "Failed to load NTT DATA checkout script. The UAT CDN may be temporarily unavailable.",
    )
  );
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
  const status = (
    hit as PerformanceResourceTiming & { responseStatus?: number }
  ).responseStatus;
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
      if (frameStatus === 403 || frameStatus === 404 || frameStatus === 503) {
        console.info("[nttdata checkout] frame_http", { status: frameStatus });
        finish(
          new Error(
            frameStatus === 503
              ? "NTT DATA UAT payment page is temporarily unavailable (HTTP 503). Please try again in a few minutes."
              : returnUrlIsLocal
                ? "Payment page was blocked. Set NEXT_PUBLIC_APP_URL to a public HTTPS URL whitelisted with NTT DATA UAT, restart the server, and try again."
                : "Payment page was blocked. Confirm your return URL domain is whitelisted with NTT DATA UAT, then try again.",
          ),
        );
        return;
      }

      if (
        isAtomIframeVisible() &&
        frameStatus !== undefined &&
        frameStatus < 400
      ) {
        console.info("[nttdata checkout] frame_open", { status: frameStatus });
        finish();
      } else if (isAtomIframeVisible() && frameStatus === undefined) {
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

      if (frameStatus === 403 || frameStatus === 404 || frameStatus === 503) {
        finish(
          new Error(
            frameStatus === 503
              ? "NTT DATA UAT payment page is temporarily unavailable (HTTP 503). Please try again in a few minutes."
              : returnUrlIsLocal
                ? "Payment page was blocked. Use a public HTTPS NEXT_PUBLIC_APP_URL whitelisted for NTT DATA UAT."
                : "Payment page was blocked. Confirm return URL whitelist with NTT DATA UAT.",
          ),
        );
        return;
      }

      if (iframeVisible) {
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
  const { cart, loading, refresh } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [localReturnWarning, setLocalReturnWarning] = useState(false);
  // Default WhatsApp (live). Flip to NTT DATA only after confirming localhost.
  const [useNttData, setUseNttData] = useState(false);
  const attemptRef = useRef(0);

  useEffect(() => {
    setUseNttData(isLocalNttHost(window.location.hostname));
  }, []);

  useEffect(() => {
    return () => {
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
    const nttMode = isLocalNttHost(window.location.hostname);

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

      // Live / non-local: WhatsApp shopping only.
      if (!nttMode) {
        const url = whatsAppUrl(
          buildCheckoutWhatsAppMessage({
            orderNumber: order.orderNumber,
            name,
            email,
            phone,
            address,
            city,
            pincode,
            items: cart.items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
            })),
            subtotal: cart.subtotal,
            deliveryCharge: cart.deliveryCharge,
          }),
        );
        window.open(url, "_blank", "noopener,noreferrer");
        await fetch("/api/cart", { method: "DELETE" });
        await refresh();
        return;
      }

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
        const access =
          typeof payData.access === "string" ? payData.access.trim() : "";
        router.push(
          access
            ? `/order/${order.id}?access=${encodeURIComponent(access)}`
            : `/order/${order.id}`,
        );
        return;
      }

      const returnUrlIsLocal = Boolean(payData.returnUrlIsLocal);
      const returnUrlIsHttps = payData.returnUrlIsHttps !== false;
      if (returnUrlIsLocal || !returnUrlIsHttps) {
        setLocalReturnWarning(true);
        console.info("[nttdata checkout] warning", {
          code: "RETURN_URL_NOT_PUBLIC_HTTPS",
        });
        throw new Error(
          "Atom UAT requires a public HTTPS return URL. Set NTTDATA_RETURN_APP_URL to your HTTPS tunnel/preview origin, whitelist it with NDPS, restart, and try again.",
        );
      }

      await loadAtomCheckoutScript(String(payData.checkoutJsUrl));
      if (!window.AtomPaynetz) {
        throw new Error("NTT DATA checkout library did not load");
      }

      // Official AIPAY kit: only these five fields are mandatory.
      const options = {
        atomTokenId: String(payData.atomTokenId),
        merchId: String(payData.merchId),
        custEmail: String(payData.custEmail),
        custMobile: String(payData.custMobile),
        returnUrl: String(payData.returnUrl),
      };

      console.info("[nttdata checkout] AtomPaynetz", {
        optionKeys: Object.keys(options),
        env: "uat",
        atomTokenIdLen: options.atomTokenId.length,
        merchIdLen: options.merchId.length,
        custMobileLen: options.custMobile.length,
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
        returnUrlSource:
          typeof payData.returnUrlSource === "string"
            ? payData.returnUrlSource
            : null,
      });

      // Opens the real NTT DATA UAT payment page (card / UPI / net banking).
      // After payment, Atom POSTs encData to returnUrl → callback → /order/:id.
      new window.AtomPaynetz(options, "uat");
      await watchAtomCheckoutOpen({ returnUrlIsLocal: false });
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
        <h1 className={styles.title}>
          {useNttData ? "NTT DATA test payment" : "Confirm your order"}
        </h1>
        <p className={styles.lead}>
          {useNttData
            ? "Enter your delivery details, then pay with the NTT DATA Atom UAT gateway. After a successful test payment you return here and see your products, total, and customer details on the order page."
            : "Enter your delivery details. The confirm button opens WhatsApp with your notebooks, quantities, and total so we can complete the order."}
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
              <p className={styles.total}>
                Books · {formatINR(cart.subtotal)}
              </p>
              <p className={styles.total}>
                Delivery · {formatINR(cart.deliveryCharge)}
              </p>
              <p className={styles.total}>Total · {formatINR(cart.total)}</p>
            </div>

            {useNttData ? (
              <p className={styles.payBadge}>NTT DATA · Atom AIPAY · UAT test</p>
            ) : null}

            {useNttData && localReturnWarning ? (
              <p className={styles.note} role="status">
                Atom UAT needs a public HTTPS return URL. Set{" "}
                <code>NTTDATA_RETURN_APP_URL=https://www.cultscribe.com</code>{" "}
                (whitelisted with NDPS), then restart the server.
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
                {useNttData ? "Phone (for payment)" : "Phone"}
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
                  className={`${styles.btn} ${
                    useNttData ? styles.btnPay : styles.btnWhatsApp
                  }`}
                  type="submit"
                  disabled={busy}
                >
                  {busy
                    ? useNttData
                      ? "Opening NTT DATA payment…"
                      : "Opening WhatsApp…"
                    : useNttData
                      ? "Pay with NTT DATA (UAT test)"
                      : "Confirm order on WhatsApp"}
                </button>
                <Link className={`${styles.btn} ${styles.btnGhost}`} href="/cart">
                  Back to cart
                </Link>
              </div>
              {useNttData ? (
                <div className={styles.testHint}>
                  <strong>UAT test instruments (official Atom sandbox)</strong>
                  <br />
                  Card: 4012 8888 8888 1881 · Expiry: any future date · CVV: 123
                  · Name: Test
                  <br />
                  UPI: atomots@upi
                  <br />
                  After payment, Atom returns you to the order page with your
                  products and delivery details.
                </div>
              ) : (
                <p className={styles.note}>
                  Confirm opens WhatsApp with your order details so we can
                  arrange payment and delivery.
                </p>
              )}
            </form>
          </div>
        ) : null}
      </main>
    </>
  );
}
