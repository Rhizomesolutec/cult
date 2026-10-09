"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef } from "react";
import styles from "./HeroNotebook.module.css";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const BG_WORDS = ["THINK", "WRITE", "CREATE", "REWRITE"] as const;

const HERO_BOOKS = [
  { src: "/page1.png", name: "The Legends Line", rotate: -4 },
  { src: "/page2.png", name: "Studio & Sketch", rotate: -18 },
  { src: "/page3.png", name: "Tour Edition", rotate: 13 },
  { src: "/cultscribe%2022.jpg", name: "Minutes to Midnight", rotate: -28 },
  {
    src: "/cultscribe%206.jpg.jpeg",
    name: "GNR Was Here",
    rotate: 22,
    objectPosition: "78% 32%",
  },
] as const;

const DROP_EASE = [0.33, 0, 0.15, 1] as const;

type HeroNotebookProps = {
  notebookImage?: string;
};

function BackgroundWord({
  word,
  index,
  scrollProgress,
}: {
  word: string;
  index: number;
  scrollProgress: MotionValue<number>;
}) {
  const y = useTransform(
    scrollProgress,
    [0, 0.5, 1],
    [0, index % 2 === 0 ? -40 : 40, index % 2 === 0 ? -80 : 60],
  );
  const opacity = useTransform(scrollProgress, [0, 0.4, 0.8], [0.06, 0.04, 0.02]);

  return (
    <motion.span
      className={styles.bgWord}
      style={{
        y,
        opacity,
        top: `${12 + index * 22}%`,
        left: index % 2 === 0 ? "-4%" : "auto",
        right: index % 2 === 0 ? "auto" : "-6%",
      }}
      aria-hidden
    >
      {word}
    </motion.span>
  );
}

export function HeroNotebook({ notebookImage }: HeroNotebookProps) {
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLElement>(null);
  const books = notebookImage
    ? HERO_BOOKS.map((book, i) => (i === 0 ? { ...book, src: notebookImage } : book))
    : HERO_BOOKS;

  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end start"],
  });

  const notebookY = useTransform(scrollYProgress, [0, 0.45, 0.85], [0, 60, 180]);
  const notebookRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-4, 2, 10]);
  const notebookRotateY = useTransform(scrollYProgress, [0.35, 0.75, 1], [0, 12, 28]);
  const notebookScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.96, 0.86]);
  const surfaceOpacity = useTransform(scrollYProgress, [0.3, 0.55], [0, 1]);
  const heroTextOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const heroTextY = useTransform(scrollYProgress, [0, 0.3], [0, -40]);
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.15], [0.6, 0]);

  return (
    <section ref={scrollRef} className={styles.heroScroll} aria-label="Hero">
      <div className={styles.heroSticky}>
        <div className={styles.heroBg} aria-hidden />
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroHalftone} aria-hidden />

        <div className={styles.bgTypography} aria-hidden>
          {BG_WORDS.map((word, i) => (
            <BackgroundWord
              key={word}
              word={word}
              index={i}
              scrollProgress={scrollYProgress}
            />
          ))}
        </div>

        <div className={styles.heroGrid}>
          <motion.div
            className={styles.copyCol}
            style={{ opacity: heroTextOpacity, y: heroTextY }}
          >
            <motion.p
              className={styles.taglineSmall}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.15 }}
            >
              RAW. REAL. WRITTEN.
            </motion.p>

            <motion.h1
              className={styles.heading}
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: reduceMotion ? 0 : 0.12,
                    delayChildren: reduceMotion ? 0 : 0.35,
                  },
                },
              }}
            >
              {["WRITE", "YOUR OWN", "CHAOS."].map((line, i) => (
                <motion.span
                  key={line}
                  className={i === 2 ? styles.headingAccent : undefined}
                  variants={{
                    hidden: reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 28, filter: "blur(10px)" },
                    show: {
                      opacity: 1,
                      y: 0,
                      filter: "blur(0px)",
                      transition: { duration: 0.7, ease: EASE_OUT },
                    },
                  }}
                >
                  {line}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              className={styles.description}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.65,
                delay: reduceMotion ? 0.1 : 0.85,
                ease: EASE_OUT,
              }}
            >
              A place for unfinished thoughts, dangerous ideas, daily plans, and
              everything worth writing down — in notebooks built like underground
              posters.
            </motion.p>

            <motion.div
              className={styles.ctaRow}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                delay: reduceMotion ? 0.15 : 1.05,
                ease: EASE_OUT,
              }}
            >
              <a className={`${styles.btn} ${styles.btnPrimary}`} href="#collection">
                Explore products
              </a>
              <Link className={`${styles.btn} ${styles.btnGhost}`} href="/#identity">
                Our story
              </Link>
            </motion.div>
          </motion.div>

          <div className={styles.visualCol}>
            <motion.div
              className={styles.surface}
              style={{ opacity: surfaceOpacity }}
              aria-hidden
            />

            <motion.div
              className={styles.notebookWrap}
              style={
                reduceMotion
                  ? undefined
                  : {
                      y: notebookY,
                      rotate: notebookRotate,
                      rotateY: notebookRotateY,
                      scale: notebookScale,
                    }
              }
            >
              <div className={styles.cluster}>
                <div className={styles.notebookGlow} aria-hidden />
                <div className={styles.notebookShadow} aria-hidden />
                {books.map((book, i) => (
                  <motion.div
                    key={book.src}
                    className={styles.book}
                    data-i={i}
                    initial={
                      reduceMotion
                        ? { opacity: 0, y: 0, rotate: book.rotate }
                        : {
                            opacity: 0,
                            y: "-110vh",
                            rotate: book.rotate - 8,
                            filter: "blur(12px)",
                          }
                    }
                    animate={{
                      opacity: 1,
                      y: 0,
                      rotate: book.rotate,
                      filter: "blur(0px)",
                    }}
                    transition={
                      reduceMotion
                        ? { duration: 0.35, delay: i * 0.05 }
                        : {
                            duration: 1.2,
                            delay: 0.18 + i * 0.12,
                            ease: DROP_EASE,
                            filter: { duration: 0.9 },
                          }
                    }
                  >
                    <Image
                      src={book.src}
                      alt={
                        i === 0
                          ? "CultScribe notebook collection"
                          : ""
                      }
                      width={420}
                      height={560}
                      priority={i < 3}
                      className={styles.bookImg}
                      style={
                        "objectPosition" in book
                          ? { objectPosition: book.objectPosition }
                          : undefined
                      }
                      draggable={false}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <motion.p className={styles.scrollHint} style={{ opacity: scrollHintOpacity }}>
          Scroll
        </motion.p>
      </div>
    </section>
  );
}
