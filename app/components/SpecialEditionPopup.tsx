"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SPECIAL_EDITION_SHOWCASE } from "@/lib/config/notebook-designs";
import { SPECIAL_EDITION_PRICE } from "@/lib/pricing";
import { formatINR } from "@/lib/commerce-client";
import styles from "./SpecialEditionPopup.module.css";

const POPUP_IMAGE = SPECIAL_EDITION_SHOWCASE.designShots[0];

export function SpecialEditionPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let shown = false;
    const reveal = () => {
      if (shown) return;
      const hero = document.querySelector("[aria-label='Hero']");
      const heroBottom = hero?.getBoundingClientRect().bottom;
      const scrolledPastHero =
        heroBottom != null
          ? heroBottom < window.innerHeight * 0.85
          : window.scrollY > window.innerHeight * 0.35;
      if (!scrolledPastHero && window.scrollY < 180) return;
      shown = true;
      setOpen(true);
      window.removeEventListener("scroll", reveal);
    };

    reveal();
    window.addEventListener("scroll", reveal, { passive: true });
    return () => window.removeEventListener("scroll", reveal);
  }, []);

  const close = () => {
    setOpen(false);
  };

  if (!open || !POPUP_IMAGE) return null;

  return (
    <div className={styles.backdrop} role="presentation" onClick={close}>
      <aside
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Special Edition"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.close}
          aria-label="Close Special Edition introduction"
          onClick={close}
        >
          ×
        </button>
        <div className={styles.media}>
          <Image
            src={POPUP_IMAGE.src}
            alt={POPUP_IMAGE.alt}
            fill
            sizes="160px"
            className={styles.img}
          />
        </div>
        <div className={styles.body}>
          <p className={styles.eyebrow}>Introducing</p>
          <p className={styles.title}>Special Edition</p>
          <p className={styles.copy}>
            Eminem and Black Sabbath — scarce covers, normal size only, ruled
            or unruled pages, {formatINR(SPECIAL_EDITION_PRICE)} each.
          </p>
          <Link href="/#special-edition" className={styles.cta} onClick={close}>
            View covers
          </Link>
        </div>
      </aside>
    </div>
  );
}
