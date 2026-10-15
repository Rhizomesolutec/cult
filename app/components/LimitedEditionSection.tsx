"use client";

import Image from "next/image";
import Link from "next/link";
import {
  LIMITED_EDITION_DESIGNS,
  LIMITED_EDITION_SHOWCASE,
  notebookSpecsLine,
  pageStyleLabel,
} from "@/lib/config/notebook-designs";
import { formatINR } from "@/lib/commerce-client";
import styles from "./LimitedEditionSection.module.css";

const LIMITED_PRICE = 65;

export function LimitedEditionSection() {
  return (
    <section
      id="limited-edition"
      className={styles.section}
      aria-labelledby="limited-edition-title"
    >
      <div className={styles.inner}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Limited Edition</span>
          <h2 id="limited-edition-title" className={styles.title}>
            Metal Book Series
          </h2>
          <p className={styles.lead}>
            Two special-edition covers — scarce run, lined pages,{" "}
            {formatINR(LIMITED_PRICE)} each.
          </p>
        </header>

        <div className={styles.designStrip} aria-label="Limited edition design shots">
          {LIMITED_EDITION_SHOWCASE.designShots.map((shot) => (
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
          {LIMITED_EDITION_DESIGNS.map((design) => {
            const showcase = LIMITED_EDITION_SHOWCASE.products.find(
              (p) => p.designSlug === design.designSlug,
            );
            return (
              <li key={design.designSlug} className={styles.item}>
                <Link
                  href={`/shop/${design.designSlug}`}
                  className={styles.card}
                  aria-label={`View ${design.name} limited edition`}
                >
                  <div className={styles.imageWrap}>
                    <Image
                      src={design.image}
                      alt=""
                      fill
                      sizes="(max-width: 639px) 90vw, 420px"
                      className={styles.image}
                    />
                    <span className={styles.badge}>Limited</span>
                  </div>
                  <div className={styles.body}>
                    <h3 className={styles.name}>{design.name}</h3>
                    <p className={styles.series}>{design.series}</p>
                    <p className={styles.specs}>
                      {notebookSpecsLine(design, true)}
                    </p>
                    <p className={styles.pageStyle}>
                      {pageStyleLabel(design.pageStyle)}
                    </p>
                    <span className={styles.price}>
                      {formatINR(LIMITED_PRICE)}
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
