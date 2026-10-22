"use client";

import Image from "next/image";
import Link from "next/link";
import { SPECIAL_EDITION_DESIGNS } from "@/lib/config/notebook-designs";
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
            Scarce covers · ruled · normal only ·{" "}
            {formatINR(SPECIAL_EDITION_PRICE)} each
          </p>
        </header>

        <ul className={styles.grid}>
          {SPECIAL_EDITION_DESIGNS.map((design) => {
            return (
              <li key={design.designSlug} className={styles.item}>
                <Link
                  href={`/shop/${design.designSlug}`}
                  className={styles.card}
                  aria-label={`View ${design.name} special edition`}
                >
                  <div className={styles.shots}>
                    <div className={styles.shot}>
                      <Image
                        src={design.image}
                        alt=""
                        fill
                        sizes="(max-width: 639px) 90vw, 420px"
                        className={styles.shotImg}
                      />
                    </div>
                    <span className={styles.badge}>Special</span>
                  </div>
                  <div className={styles.body}>
                    <h3 className={styles.name}>{design.name}</h3>
                    <span className={styles.price}>
                      {formatINR(SPECIAL_EDITION_PRICE)}
                    </span>
                  </div>
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
