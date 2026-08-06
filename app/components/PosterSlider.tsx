<<<<<<< HEAD
"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
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

function isAdjacentSlide(index: number, activeIndex: number, count: number): boolean {
  if (count <= 1) return true;
  const diff = Math.abs(index - activeIndex);
  return diff <= 1 || diff === count - 1;
}

export function PosterSlider({
  ariaLabelledBy,
  imageSizes = "(max-width: 640px) 100vw, 960px",
  slides: slidesProp,
}: PosterSliderProps) {
  const slides = slidesProp ?? DEFAULT_SLIDES;
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const count = slides.length;
  const activeIndex = count > 0 ? Math.min(index, count - 1) : 0;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const updateTrackOffset = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const width = viewport.offsetWidth;
    viewport.style.setProperty("--slide-width", `${width}px`);
    track.style.setProperty("--slide-offset", `${-activeIndex * width}px`);
  }, [activeIndex]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    updateTrackOffset();
    const observer = new ResizeObserver(updateTrackOffset);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [updateTrackOffset]);

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

        <div
          ref={trackRef}
          className={`${styles.track} ${reduceMotion ? styles.trackReduced : ""}`}
        >
          {slides.map((slideItem, i) => {
            const isActive = i === activeIndex;
            const isNear = isAdjacentSlide(i, activeIndex, count);
            const isPriority = i === 0;
            return (
              <button
                key={slideItem.src}
                type="button"
                className={`${styles.slide} ${isActive ? styles.slideActive : ""}`}
                aria-hidden={!isActive}
                aria-label={
                  isActive ? undefined : `Go to slide ${i + 1}: ${slideItem.alt}`
                }
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  if (!isActive) setIndex(i);
                }}
              >
                <Image
                  src={slideItem.src}
                  alt={slideItem.alt}
                  fill
                  sizes={imageSizes}
                  className={styles.image}
                  priority={isPriority}
                  {...(!isPriority && { loading: isNear ? "eager" : "lazy" })}
                  fetchPriority={isActive || isPriority ? "high" : isNear ? "auto" : "low"}
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
=======
"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
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

function isAdjacentSlide(index: number, activeIndex: number, count: number): boolean {
  if (count <= 1) return true;
  const diff = Math.abs(index - activeIndex);
  return diff <= 1 || diff === count - 1;
}

export function PosterSlider({
  ariaLabelledBy,
  imageSizes = "(max-width: 640px) 100vw, 960px",
  slides: slidesProp,
}: PosterSliderProps) {
  const slides = slidesProp ?? DEFAULT_SLIDES;
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const count = slides.length;
  const activeIndex = count > 0 ? Math.min(index, count - 1) : 0;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const updateTrackOffset = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const width = viewport.offsetWidth;
    viewport.style.setProperty("--slide-width", `${width}px`);
    track.style.setProperty("--slide-offset", `${-activeIndex * width}px`);
  }, [activeIndex]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    updateTrackOffset();
    const observer = new ResizeObserver(updateTrackOffset);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [updateTrackOffset]);

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

        <div
          ref={trackRef}
          className={`${styles.track} ${reduceMotion ? styles.trackReduced : ""}`}
        >
          {slides.map((slideItem, i) => {
            const isActive = i === activeIndex;
            const isNear = isAdjacentSlide(i, activeIndex, count);
            const isPriority = i === 0;
            return (
              <button
                key={slideItem.src}
                type="button"
                className={`${styles.slide} ${isActive ? styles.slideActive : ""}`}
                aria-hidden={!isActive}
                aria-label={
                  isActive ? undefined : `Go to slide ${i + 1}: ${slideItem.alt}`
                }
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  if (!isActive) setIndex(i);
                }}
              >
                <Image
                  src={slideItem.src}
                  alt={slideItem.alt}
                  fill
                  sizes={imageSizes}
                  className={styles.image}
                  priority={isPriority}
                  {...(!isPriority && { loading: isNear ? "eager" : "lazy" })}
                  fetchPriority={isActive || isPriority ? "high" : isNear ? "auto" : "low"}
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
>>>>>>> a23029f (Add CultScribe e-commerce, admin panel, and SMTP email structure)
