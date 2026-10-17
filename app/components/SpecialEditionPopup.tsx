"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SPECIAL_EDITION_SHOWCASE } from "@/lib/config/notebook-designs";
import { SPECIAL_EDITION_PRICE } from "@/lib/pricing";
import { formatINR } from "@/lib/commerce-client";
import styles from "./SpecialEditionPopup.module.css";

const STORAGE_KEY = "cultscribe_special_edition_promo";
const POPUP_IMAGE = SPECIAL_EDITION_SHOWCASE.designShots[0];

type PromoMode = "open" | "stuck" | "hidden";

export function SpecialEditionPopup() {
  const [mode, setMode] = useState<PromoMode>("hidden");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as PromoMode | null;
      if (saved === "stuck" || saved === "hidden") {
        setMode(saved);
      } else {
        setMode("open");
      }
    } catch {
      setMode("open");
    }
    setReady(true);
  }, []);

  const persist = (next: PromoMode) => {
    setMode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  if (!ready || mode === "hidden" || !POPUP_IMAGE) return null;

  if (mode === "stuck") {
    return (
      <button
        type="button"
        className={styles.stuck}
        onClick={() => persist("open")}
        aria-label="Open Special Edition offer"
      >
        Special Edition
      </button>
    );
  }

  return (
    <aside className={styles.panel} role="dialog" aria-label="Special Edition">
      <div className={styles.media}>
        <Image
          src={POPUP_IMAGE.src}
          alt={POPUP_IMAGE.alt}
          fill
          sizes="(max-width: 480px) 44px, 60px"
          className={styles.img}
        />
      </div>
      <div className={styles.body}>
        <p className={styles.eyebrow}>Special Edition</p>
        <p className={styles.title}>Metal Book Series</p>
        <p className={styles.copy}>
          Normal only · {formatINR(SPECIAL_EDITION_PRICE)}
        </p>
        <div className={styles.actions}>
          <Link
            href="/#special-edition"
            className={styles.cta}
            onClick={() => persist("stuck")}
          >
            View covers
          </Link>
          <button
            type="button"
            className={styles.ghost}
            onClick={() => persist("stuck")}
          >
            Stick
          </button>
          <button
            type="button"
            className={styles.close}
            aria-label="Dismiss Special Edition promo"
            onClick={() => persist("hidden")}
          >
            ×
          </button>
        </div>
      </div>
    </aside>
  );
}
