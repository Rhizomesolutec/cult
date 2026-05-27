"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { LedgerSection } from "./components/LedgerSection";
import {
  PosterSlider,
  type PosterSliderSlide,
} from "./components/PosterSlider";
import { SiteHeader } from "./components/SiteHeader";
import styles from "./page.module.css";

const ESSENCE = [
  "Rebellion",
  "Creativity",
  "Timelessness",
  "Art",
  "Music culture",
] as const;

const NOTEBOOKS = [
  {
    id: "01",
    title: "The Legends line",
    description:
      "Premium hardcovers with finishes inspired by the era when album art was sacred. Your space for lyrics, riffs, and real ideas.",
    note: "Specs & pricing — coming as you share them",
    coverSrc: "/page9.jpeg",
  },
  {
    id: "02",
    title: "Studio & sketch",
    description:
      "Lay-flat pages for sketches, setlists, and setpiece notes. Built for dorms, studios, and late-night writing sessions.",
    note: "Paper weights & sizes — TBD from you",
    coverSrc: "/page1.png",
  },
  {
    id: "03",
    title: "Tour edition",
    description:
      "Durable, road-ready build—because ideas don’t wait for a desk. Every cover tells a story worth carrying forward.",
    note: "Colorways & limited drops — you define",
    coverSrc: "/page5.jpeg",
  },
] as const;

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const IDENTITY_SLIDER_SLIDES: readonly PosterSliderSlide[] = [
  {
    src: "/page4.jpeg",
    alt: "Van Halen live on stage — Eddie Van Halen on the Frankenstrat with David Lee Roth, black and white concert photo.",
  },
  {
    src: "/page5.jpeg",
    alt: "Led Zeppelin with The Starship tour plane — band portrait on the airfield, black and white.",
  },
  {
    src: "/page6.jpeg",
    alt: "Bob Dylan in the studio with electric guitar, harmonica rack, and cigarette — black and white.",
  },
  {
    src: "/page7.jpeg",
    alt: "Willie Nelson on stage with Trigger and a spraying beer can — black and white.",
  },
  {
    src: "/page8.jpeg",
    alt: "AC/DC group portrait — Angus Young in schoolboy outfit with Gibson SG, Bon Scott and band, black and white.",
  },
];

export default function Home() {
  const reduceMotion = useReducedMotion();

  const heroContainer = useMemo(
    () => ({
      hidden: {},
      show: {
        transition: {
          staggerChildren: reduceMotion ? 0 : 0.1,
          delayChildren: reduceMotion ? 0 : 0.06,
        },
      },
    }),
    [reduceMotion],
  );

  /** Hero: blur clears + soft rise */
  const blurFadeUp = useMemo(
    () => ({
      hidden: reduceMotion
        ? { opacity: 0 }
        : { opacity: 0, y: 22, filter: "blur(12px)" },
      show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
          duration: reduceMotion ? 0.01 : 0.72,
          ease: EASE_OUT,
        },
      },
    }),
    [reduceMotion],
  );

  const filmBar = useMemo(
    () => ({
      hidden: reduceMotion
        ? { opacity: 0 }
        : { opacity: 0, scaleX: 0, filter: "blur(6px)" },
      show: {
        opacity: 1,
        scaleX: 1,
        filter: "blur(0px)",
        transition: {
          duration: reduceMotion ? 0.01 : 0.8,
          ease: EASE_OUT,
        },
      },
    }),
    [reduceMotion],
  );

  /** Scroll-in sections: staggered blur fade */
  const inViewParent = useMemo(
    () => ({
      hidden: {},
      show: {
        transition: {
          staggerChildren: reduceMotion ? 0 : 0.11,
          delayChildren: reduceMotion ? 0 : 0.04,
        },
      },
    }),
    [reduceMotion],
  );

  const inViewChild = useMemo(
    () => ({
      hidden: reduceMotion
        ? { opacity: 0 }
        : { opacity: 0, y: 26, filter: "blur(8px)" },
      show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
          duration: reduceMotion ? 0.01 : 0.68,
          ease: EASE_OUT,
        },
      },
    }),
    [reduceMotion],
  );

  const inViewViewport = {
    once: true,
    margin: "-72px 0px -48px 0px",
    amount: 0.2,
  } as const;

  return (
    <>
      <SiteHeader />

      <main className={styles.main} id="top">
        <motion.section
          className={styles.hero}
          aria-label="Intro"
          variants={heroContainer}
          initial="hidden"
          animate="show"
        >
          <div className={styles.heroGlow} aria-hidden />
          <div className={styles.heroGrid} aria-hidden />

          <motion.div className={styles.logoWrap} variants={blurFadeUp}>
            <Image
              src="/logo.png"
              alt="CultScribe — Raw. Real. Written."
              width={520}
              height={200}
              priority
              style={{ width: "100%", height: "auto" }}
            />
          </motion.div>

          <motion.p className={styles.heroEst} variants={blurFadeUp}>
            Analog soul · Hand-finished spirit
          </motion.p>

          <motion.div
            className={styles.heroFilmBar}
            variants={filmBar}
            aria-hidden
          />

          <motion.h1 className={styles.tagline} variants={blurFadeUp}>
            Where <span>legends</span> live forever
          </motion.h1>
          <motion.p className={styles.heroSub} variants={blurFadeUp}>
            Notebooks that honor the timeless spirit of rock and metal—born from
            a love of musical history, built for students and creators who refuse
            generic stationery.
          </motion.p>
          <motion.div className={styles.ctaRow} variants={blurFadeUp}>
            <a className={`${styles.btn} ${styles.btnPrimary}`} href="#notebooks">
              Explore notebooks
            </a>
            <a className={`${styles.btn} ${styles.btnGhost}`} href="#identity">
              Our story
            </a>
          </motion.div>
          <motion.p className={styles.scrollHint} variants={blurFadeUp}>
            Scroll
          </motion.p>
        </motion.section>

        <section
          className={styles.posterSection}
          aria-labelledby="poster-showcase-title"
        >
          <motion.div
            className={styles.posterSectionInner}
            variants={inViewParent}
            initial="hidden"
            whileInView="show"
            viewport={inViewViewport}
          >
            <motion.span
              className={styles.posterEyebrow}
              variants={inViewChild}
            >
              The art
            </motion.span>
            <motion.h2
              id="poster-showcase-title"
              className={styles.posterTitle}
              variants={inViewChild}
            >
              Covers that hit like classic posters
            </motion.h2>
            <motion.div variants={inViewChild}>
              <PosterSlider ariaLabelledBy="poster-showcase-title" />
            </motion.div>
          </motion.div>
        </section>

        <section
          className={styles.section}
          id="identity"
          aria-labelledby="identity-title"
        >
          <div className={styles.identityGrid}>
            <div className={styles.identityCopy}>
              <motion.div
                className={styles.sectionHeader}
                variants={inViewParent}
                initial="hidden"
                whileInView="show"
                viewport={inViewViewport}
              >
                <motion.span className={styles.eyebrow} variants={inViewChild}>
                  Brand identity
                </motion.span>
                <motion.h2
                  id="identity-title"
                  className={styles.title}
                  variants={inViewChild}
                >
                  Write boldly. Think freely.
                </motion.h2>
                <motion.p className={styles.lead} variants={inViewChild}>
                  CultScribe fuses design with the stories behind the bands you grew up
                  on—The Beatles, Pink Floyd, Guns N’ Roses, Led Zeppelin, Metallica,
                  and the legends still echoing in your headphones. This isn’t filler
                  merch: every cover is treated as a piece of cultural history, and every
                  page is a companion for notes, lyrics, dreams, and sketches.
                </motion.p>
              </motion.div>

              <motion.div
                className={styles.brandBlock}
                variants={inViewParent}
                initial="hidden"
                whileInView="show"
                viewport={inViewViewport}
              >
                <motion.p
                  className={styles.lead}
                  style={{ marginTop: 0, maxWidth: "none" }}
                  variants={inViewChild}
                >
                  We stand against flat, forgettable notebooks. We’re for rebellion,
                  creativity, timeless art, and music culture—stamped into something you
                  can hold, flip through, and fill.
                </motion.p>
                <motion.blockquote className={styles.quote} variants={inViewChild}>
                  Every cover is a piece of cultural history—a place where your own
                  voice joins the story.
                </motion.blockquote>
                <motion.div
                  className={styles.essenceGrid}
                  role="list"
                  aria-label="Brand essence"
                  variants={inViewParent}
                >
                  {ESSENCE.map((word) => (
                    <motion.div
                      className={styles.essenceCard}
                      key={word}
                      role="listitem"
                      variants={inViewChild}
                    >
                      {word}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              className={styles.identitySliderCol}
              variants={inViewParent}
              initial="hidden"
              whileInView="show"
              viewport={inViewViewport}
            >
              <motion.div className={styles.identitySliderShell} variants={inViewChild}>
                <PosterSlider
                  ariaLabelledBy="identity-title"
                  imageSizes="(max-width: 959px) min(100vw - 3rem, 400px), 300px"
                  slides={IDENTITY_SLIDER_SLIDES}
                />
              </motion.div>
            </motion.div>
          </div>
        </section>

        <LedgerSection />

        <div className={styles.notebookStrip} id="notebooks">
          <section
            className={styles.section}
            style={{ maxWidth: 1200, margin: "0 auto" }}
            aria-labelledby="notebooks-title"
          >
            <motion.div
              className={styles.sectionHeader}
              variants={inViewParent}
              initial="hidden"
              whileInView="show"
              viewport={inViewViewport}
            >
              <motion.span className={styles.eyebrow} variants={inViewChild}>
                The collection
              </motion.span>
              <motion.h2
                id="notebooks-title"
                className={styles.title}
                variants={inViewChild}
              >
                Notebooks like album art
              </motion.h2>
              <motion.p className={styles.lead} variants={inViewChild}>
                A gallery of covers and formats—tuned for the way you create. When
                you share final names, paper specs, and price points, we can swap
                these cards for your real lineup.
              </motion.p>
            </motion.div>
            <motion.div
              className={styles.cards}
              variants={inViewParent}
              initial="hidden"
              whileInView="show"
              viewport={inViewViewport}
            >
              {NOTEBOOKS.map((item) => (
                <motion.article
                  className={styles.card}
                  key={item.id}
                  variants={inViewChild}
                >
                  <div className={styles.cardCover} aria-hidden>
                    <Image
                      src={item.coverSrc}
                      alt=""
                      fill
                      sizes="(max-width: 639px) 100vw, (max-width: 999px) 50vw, 360px"
                      className={styles.cardCoverImg}
                      draggable={false}
                    />
                    <div className={styles.cardCoverTint} />
                    <div className={styles.cardCoverVignette} />
                    <div className={styles.cardCoverGrain} />
                  </div>
                  <div className={styles.cardContent}>
                    <span className={styles.cardNum}>Series {item.id}</span>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <p className={styles.cardDesc}>{item.description}</p>
                    <p className={styles.cardTag}>{item.note}</p>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </section>
        </div>

        <motion.section
          className={styles.footerCta}
          aria-label="Call to action"
          variants={inViewParent}
          initial="hidden"
          whileInView="show"
          viewport={inViewViewport}
        >
          <motion.h2
            className={styles.title}
            style={{ fontSize: "2rem" }}
            variants={inViewChild}
          >
            Your story. Your pages.
          </motion.h2>
          <motion.p variants={inViewChild}>
            Drop your notebook details, imagery, and links when you’re ready—we’ll
            wire them into this layout so the page stays as bold as the brand.
          </motion.p>
          <motion.div variants={inViewChild}>
            <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/contact">
              Get in touch
            </Link>
          </motion.div>
        </motion.section>

        <motion.footer
          className={styles.footer}
          role="contentinfo"
          initial={
            reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, filter: "blur(6px)" }
          }
          whileInView={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: 1, y: 0, filter: "blur(0px)" }
          }
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.55, ease: EASE_OUT }}
        >
          <span>CultScribe</span> — Where legends live forever
          <small>Raw. Real. Written. · Inspired by the spirit of rock &amp; metal</small>
        </motion.footer>
      </main>
    </>
  );
}
