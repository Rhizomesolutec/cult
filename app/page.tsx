"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { CollectionStats } from "./components/CollectionStats";
import { ExploreCollection } from "./components/ExploreCollection";
import { HeroNotebook } from "./components/HeroNotebook";
import { HomeProductsSection } from "./components/HomeProductsSection";
import { LedgerSection } from "./components/LedgerSection";
import {
  PosterSlider,
  type PosterSliderSlide,
} from "./components/PosterSlider";
import { SiteHeader } from "./components/SiteHeader";
import { PosterStack } from "./components/PosterStack";
import { COLLECTION_GALLERY_ITEMS } from "./config/showcase-images";
import styles from "./page.module.css";

const ESSENCE = [
  "Rebellion",
  "Creativity",
  "Timelessness",
  "Art",
  "Music culture",
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

      <main id="top">
        <HeroNotebook />

        <ExploreCollection />

        <CollectionStats />

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
            <motion.div variants={inViewChild} className="w-full">
              <PosterStack
                titleId="poster-showcase-title"
                eyebrow="The art"
                title="Covers that hit like classic posters"
                subtitle="The same notebooks from our collection — swipe or tap a cover behind to shuffle the stack."
                items={COLLECTION_GALLERY_ITEMS}
              />
            </motion.div>
          </motion.div>
        </section>

        <HomeProductsSection
          inViewParent={inViewParent}
          inViewChild={inViewChild}
          inViewViewport={inViewViewport}
        />

        <LedgerSection />

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

        <motion.section
          className={styles.footerCta}
          aria-label="Call to action"
          variants={inViewParent}
          initial="hidden"
          whileInView="show"
          viewport={inViewViewport}
        >
          <motion.h2
            className={`${styles.title} ${styles.footerTitle}`}
            variants={inViewChild}
          >
            Your story. Your pages.
          </motion.h2>
          <motion.p variants={inViewChild}>
            Drop your notebook details, imagery, and links when you’re ready—we’ll
            wire them into this layout so the page stays as bold as the brand.
          </motion.p>
          <motion.div variants={inViewChild}>
            <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/shop">
              Shop now
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
