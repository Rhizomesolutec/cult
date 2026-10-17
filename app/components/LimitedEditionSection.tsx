"use client";

import Image from "next/image";
import Link from "next/link";
import {
  SPECIAL_EDITION_DESIGNS,
  SPECIAL_EDITION_SHOWCASE,
  notebookSpecsLine,
  pageStyleLabel,
} from "@/lib/config/notebook-designs";
import { SPECIAL_EDITION_PRICE } from "@/lib/pricing";
import { formatINR } from "@/lib/commerce-client";
import styles from "./LimitedEditionSection.module.css";

export function LimitedEditionSection() {
  return (
    <section
      id="special-edition"
      className={styles.section}
      aria-labelledby="special-edition-title"
    >
      <div className={styles.inner}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Special Edition</span>
          <h2 id="special-edition-title" className={styles.title}>
            Metal Book Series
          </h2>
          <p className={styles.lead}>
            Two special-edition covers — scarce run, lined pages, normal size
            only (no A4). {formatINR(SPECIAL_EDITION_PRICE)} each.
          </p>
        </header>

        <div
          className={styles.designStrip}
          aria-label="Special edition design shots"
        >
          {SPECIAL_EDITION_SHOWCASE.designShots.map((shot) => (
            <div key={shot.src} className={styles.designShot}>
              <Image
                src={shot.src}
                alt={shot.alt}
                fill
                sizes="(max-width: 639px) 90vw, 360px"
                className={styles.designShotImg}
              />
            </div>
          ))}
        </div>

        <ul className={styles.grid}>
          {SPECIAL_EDITION_DESIGNS.map((design) => {
            const showcase = SPECIAL_EDITION_SHOWCASE.products.find(
              (p) => p.designSlug === design.designSlug,
            );
            return (
              <li key={design.designSlug} className={styles.item}>
                <Link
                  href={`/shop/${design.designSlug}`}
                  className={styles.card}
                  aria-label={`View ${design.name} special edition`}
                >
                  <div className={styles.imageWrap}>
                    <Image
                      src={design.image}
                      alt=""
                      fill
                      sizes="(max-width: 639px) 90vw, 420px"
                      className={styles.image}
                    />
                    <span className={styles.badge}>Special</span>
                  </div>
                  <div className={styles.body}>
                    <h3 className={styles.name}>{design.name}</h3>
                    <p className={styles.series}>{design.series}</p>
                    <p className={styles.specs}>
                      {notebookSpecsLine(design, true)}
                    </p>
                    <p className={styles.pageStyle}>
                      {pageStyleLabel(design.pageStyle)} · Normal only
                    </p>
                    <span className={styles.price}>
                      {formatINR(SPECIAL_EDITION_PRICE)}
                    </span>
                  </div>
                  {showcase ? (
                    <div className={styles.thumbRow} aria-hidden>
                      <div className={styles.thumb}>
                        <Image
                          src={showcase.flatArt}
                          alt=""
                          fill
                          sizes="80px"
                          className={styles.thumbImg}
                        />
                      </div>
                      <div className={styles.thumb}>
                        <Image
                          src={showcase.back}
                          alt=""
                          fill
                          sizes="80px"
                          className={styles.thumbImg}
                        />
                      </div>
                    </div>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** @deprecated Prefer LimitedEditionSection (now Special Edition branding). */
export const SpecialEditionSection = LimitedEditionSection;
