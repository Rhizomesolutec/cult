"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import type { GalleryItem } from "@/app/config/showcase-images";
import styles from "./PosterStack.module.css";

const AUTOPLAY_MS = 5200;
const STACK_DEPTH = 3;
const SWIPE_PX = 48;

type PosterStackProps = {
  titleId: string;
  eyebrow?: string;
  title: string;
  subtitle: string;
  items: readonly GalleryItem[];
};

function wrap(index: number, count: number) {
  return ((index % count) + count) % count;
}

function slotFor(rel: number, count: number): string {
  if (rel === 0) return "front";
  if (rel <= STACK_DEPTH) return String(rel);
  if (rel === count - 1) return "exit";
  return "hidden";
}

export function PosterStack({
  titleId,
  eyebrow,
  title,
  subtitle,
  items,
}: PosterStackProps) {
  const count = items.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const pointerX = useRef<number | null>(null);

  const activeIndex = count > 0 ? wrap(index, count) : 0;
  const active = items[activeIndex];

  const goTo = useCallback(
    (next: number) => {
      if (count < 2) return;
      setIndex(wrap(next, count));
    },
    [count],
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduceMotion || paused || count < 2) return;
    const t = window.setInterval(goNext, AUTOPLAY_MS);
    return () => window.clearInterval(t);
  }, [goNext, paused, reduceMotion, count]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    pointerX.current = e.clientX;
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (pointerX.current == null) return;
    const dx = e.clientX - pointerX.current;
    pointerX.current = null;
    if (dx <= -SWIPE_PX) goNext();
    else if (dx >= SWIPE_PX) goPrev();
  };

  if (!active) return null;

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p className={styles.lead}>{subtitle}</p>
      </header>

      <div
        className={styles.gallery}
        role="region"
        aria-roledescription="carousel"
        aria-labelledby={titleId}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            goPrev();
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            goNext();
          }
        }}
      >
        <div
          className={`${styles.stage} ${reduceMotion ? styles.stageReduced : ""}`}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            pointerX.current = null;
          }}
        >
          {items.map((item, i) => {
            const rel = wrap(i - activeIndex, count);
            const slot = slotFor(rel, count);
            const near = rel === 0 || rel <= STACK_DEPTH;
            const isFront = slot === "front";
            const image = (
              <Image
                src={item.photo.url}
                alt={isFront ? item.photo.text : ""}
                fill
                sizes="(max-width: 639px) 58vw, 280px"
                className={styles.image}
                style={{ objectPosition: item.photo.pos || "center" }}
                priority={i === 0}
                loading={near || i === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            );

            if (isFront) {
              return (
                <div
                  key={item.photo.url}
                  className={styles.layer}
                  data-slot={slot}
                >
                  {image}
                </div>
              );
            }

            return (
              <button
                key={item.photo.url}
                type="button"
                className={styles.layer}
                data-slot={slot}
                tabIndex={near ? 0 : -1}
                aria-hidden={!near}
                aria-label={`Show ${item.common}`}
                onClick={() => goTo(i)}
              >
                {image}
              </button>
            );
          })}
        </div>

        <div className={styles.meta}>
          <p className={styles.counter} aria-hidden>
            {String(activeIndex + 1).padStart(2, "0")}
            <span className={styles.counterSep}>/</span>
            {String(count).padStart(2, "0")}
          </p>
          <h3 className={styles.name} aria-live={reduceMotion ? "off" : "polite"}>
            {active.common}
          </h3>
          <p className={styles.series}>{active.binomial}</p>
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.nav}
            onClick={goPrev}
            aria-label="Previous poster"
          >
            ←
          </button>
          <button
            type="button"
            className={styles.nav}
            onClick={goNext}
            aria-label="Next poster"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
