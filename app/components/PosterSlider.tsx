"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import styles from "./PosterSlider.module.css";

export type PosterSliderSlide = {
  src: string;
  alt: string;
};

const DEFAULT_SLIDES: readonly PosterSliderSlide[] = [
  {
    src: "/page1.png",
    alt: "CultScribe poster — Guns N’ Roses inspired artwork with GNR Was Here headline.",
  },
  {
    src: "/page2.png",
    alt: "CultScribe poster — Pink Floyd inspired handshake scene with Dark Side of the Moon reference.",
  },
  {
    src: "/page3.png",
    alt: "CultScribe poster — Ozzy Osbourne inspired Prince of Darkness artwork.",
  },
];

const AUTOPLAY_MS = 7000;

function ChevronLeft() {
  return (
    <svg className={styles.navIcon} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className={styles.navIcon} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
      />
    </svg>
  );
}

type PosterSliderProps = {
  /** Visible heading id on the page (carousel accessible name). */
  ariaLabelledBy: string;
  /** Passed to next/image `sizes` when embedded in a narrow column. */
  imageSizes?: string;
  /** Override default poster slides (e.g. brand identity column). */
  slides?: readonly PosterSliderSlide[];
};

export function PosterSlider({
  ariaLabelledBy,
  imageSizes = "(max-width: 640px) 100vw, 520px",
  slides: slidesProp,
}: PosterSliderProps) {
  const slides = slidesProp ?? DEFAULT_SLIDES;
  const reduceMotion = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = slides.length;

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, count - 1)));
  }, [count]);
  const goPrev = useCallback(
    () => setIndex((i) => (i - 1 + count) % count),
    [count],
  );
  const goNext = useCallback(
    () => setIndex((i) => (i + 1) % count),
    [count],
  );

  useEffect(() => {
    if (reduceMotion || paused) return;
    const t = window.setInterval(goNext, AUTOPLAY_MS);
    return () => window.clearInterval(t);
  }, [goNext, paused, reduceMotion]);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const t = e.target;
      if (!(t instanceof Node) || !root.contains(t)) return;
      if (
        t instanceof HTMLElement &&
        t.closest("input, textarea, select, [contenteditable=true]")
      ) {
        return;
      }
      e.preventDefault();
      if (e.key === "ArrowLeft") goPrev();
      else goNext();
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  const transition = useMemo(
    () => ({
      duration: reduceMotion ? 0.01 : 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    }),
    [reduceMotion],
  );

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      role="region"
      aria-roledescription="carousel"
      aria-labelledby={ariaLabelledBy}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      <div
        className={styles.viewport}
        aria-live={reduceMotion ? "off" : "polite"}
      >
        <div className={styles.dots} role="tablist" aria-label="Choose slide">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1} of ${count}`}
              className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>

        <button
          type="button"
          className={`${styles.nav} ${styles.navPrev}`}
          onClick={goPrev}
          aria-label="Previous slide"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          className={`${styles.nav} ${styles.navNext}`}
          onClick={goNext}
          aria-label="Next slide"
        >
          <ChevronRight />
        </button>

        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={index}
            className={styles.slide}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={transition}
          >
            <Image
              src={slides[index].src}
              alt={slides[index].alt}
              fill
              sizes={imageSizes}
              className={styles.image}
              priority={index === 0}
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
