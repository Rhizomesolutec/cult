"use client";

import Image from "next/image";
import Link from "next/link";
import { NOTEBOOK_DESIGNS } from "@/lib/config/notebook-designs";
import { formatINR } from "@/lib/commerce-client";
import styles from "./ExploreCollection.module.css";

export function ExploreCollection() {
  return (
    <section
      id="collection"
      className={styles.section}
      aria-labelledby="collection-title"
    >
      <div className={styles.inner}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Collection</span>
          <h2 id="collection-title" className={styles.title}>
            Our notebooks
          </h2>
          <p className={styles.lead}>
            7 unique designs · {formatINR(60)} each
          </p>
        </header>

        <ul className={styles.grid}>
          {NOTEBOOK_DESIGNS.map((design) => (
            <li key={design.designSlug} className={styles.item}>
              <Link
                href={`/shop/${design.designSlug}`}
                className={styles.card}
                aria-label={`View ${design.name}`}
              >
                <div className={styles.imageWrap}>
                  <Image
                    src={design.image}
                    alt=""
                    fill
                    sizes="(max-width: 639px) 50vw, (max-width: 959px) 33vw, 280px"
                    className={styles.image}
                  />
                </div>

                <div className={styles.body}>
                  <h3 className={styles.name}>{design.name}</h3>
                  <p className={styles.series}>{design.series}</p>
                  <span className={styles.price}>{formatINR(60)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
