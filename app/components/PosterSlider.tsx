"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import styles from "./PosterSlider.module.css";

export type PosterSliderSlide = {
  src: string;
  alt: string;
};

const slide = (file: string, alt: string): PosterSliderSlide => ({
  src: `/${encodeURI(file)}`,
  alt,
});

const DEFAULT_SLIDES: readonly PosterSliderSlide[] = [
  slide(
    "cultscribe 3.jpg.jpeg",
    "CultScribe product showcase — Prince of Darkness notebook on a black pedestal with blurred titles in the background.",
  ),
  slide(
    "cultscribe 5.jpg",
    "CultScribe product showcase — Prince of Darkness cover art on a pedestal with additional notebooks behind.",
  ),
  slide(
    "cultscribe 6.jpg.jpeg",
    "CultScribe product lineup — GNR Was Here notebook standing among zines and cassette tapes on a dark surface.",
  ),
  slide(
    "cultscribe 8.jpg",
    "CultScribe product showcase — GNR Was Here notebook on a black pedestal with blurred CultScribe titles behind.",
  ),
  slide(
    "cultscribe 9.jpg",
    "CultScribe poster collection — four notebook covers scattered on a black background.",
  ),
  slide(
    "cultscribe 11.jpg",
    "CultScribe flat lay — notebooks and cassette tapes on a dark surface with GNR Was Here standing upright.",
  ),
  slide(
    "cultscribe12.jpg",
    "CultScribe flat lay — Minutes to Midnight, Prince of Darkness, and Dark Side notebooks with vintage cassettes.",
  ),
  slide(
    "cultscribe 16.jpg",
    "CultScribe poster spread — four iconic notebook covers arranged on a black background.",
  ),
  slide(
    "cultscribe 19.jpg",
    "CultScribe collection — four notebooks and three cassette tapes on a dark matte surface.",
  ),
  slide(
    "cultscribe 20.jpg",
    "CultScribe product showcase — Minutes to Midnight notebook in focus with blurred titles behind.",
  ),
  slide(
    "cultscribe 22.jpg",
    "CultScribe Minutes to Midnight notebook cover — singer silhouette with horizon line artwork.",
  ),
];

const AUTOPLAY_MS = 5000;

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
  imageSizes = "(max-width: 640px) 100vw, 960px",
  slides: slidesProp,
}: PosterSliderProps) {
  const slides = slidesProp ?? DEFAULT_SLIDES;
  const reduceMotion = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [layout, setLayout] = useState({
    slideWidth: 0,
    slideStep: 0,
    centerOffset: 0,
    gap: 0,
  });

  const count = slides.length;
  const activeIndex = count > 0 ? Math.min(index, count - 1) : 0;

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateLayout = () => {
      const width = viewport.offsetWidth;
      setLayout({
        slideWidth: width,
        slideStep: width,
        centerOffset: 0,
        gap: 0,
      });
    };

    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

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
      duration: reduceMotion ? 0.01 : 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
    }),
    [reduceMotion],
  );

  const trackX = layout.centerOffset - activeIndex * layout.slideStep;

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
        ref={viewportRef}
        className={styles.viewport}
        aria-live={reduceMotion ? "off" : "polite"}
      >
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

        <motion.div
          className={styles.track}
          style={{ gap: layout.gap ? `${layout.gap}px` : undefined }}
          animate={{ x: trackX }}
          transition={transition}
        >
          {slides.map((slide, i) => {
            const isActive = i === activeIndex;
            return (
              <motion.button
                key={slide.src}
                type="button"
                className={styles.slide}
                style={{ width: layout.slideWidth || undefined }}
                aria-hidden={!isActive}
                aria-label={isActive ? undefined : `Go to slide ${i + 1}: ${slide.alt}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  if (!isActive) setIndex(i);
                }}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes={imageSizes}
                  className={styles.image}
                  priority={i === 0}
                  draggable={false}
                />
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
