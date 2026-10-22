"use client";

import Image from "next/image";
import Link from "next/link";
import {
  DESIGN_COUNT,
  NOTEBOOK_DESIGNS,
  NOTEBOOK_SPECS,
  notebookSpecsLine,
  pageOfferLabel,
} from "@/lib/config/notebook-designs";
import {
  COMBO_PACK_PRICE,
  COMBO_PACK_SIZE,
  NORMAL_COMPARE_AT,
  NORMAL_PRICE,
  SPECIAL_EDITION_PRICE,
} from "@/lib/pricing";
import { PriceTag } from "@/app/components/PriceTag";
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
            {DESIGN_COUNT} unique designs · {NOTEBOOK_SPECS.pages} pages ·{" "}
            {NOTEBOOK_SPECS.gsm} GSM · from {formatINR(NORMAL_PRICE)}
          </p>
          <p className={styles.paperLead}>{NOTEBOOK_SPECS.paper} paper</p>
          <p className={styles.pageHint}>
            Ruled only: Never Free, Never Me. Unruled only: GNR, Pink Floyd,
            Ozzy, and Linkin Park. Special Edition (Eminem and Black Sabbath)
            is ruled and unruled, normal size only.
          </p>
        </header>

        <aside className={styles.combo} aria-labelledby="combo-title">
          <p className={styles.comboEyebrow}>Combo pack · Normal books only</p>
          <h3 id="combo-title" className={styles.comboTitle}>
            {COMBO_PACK_SIZE} notebooks for {formatINR(COMBO_PACK_PRICE)}
          </h3>
          <p className={styles.comboCopy}>
            Mix any normal-size covers (not Special Edition, not A4). One book is{" "}
            {formatINR(NORMAL_PRICE)}; every {COMBO_PACK_SIZE} together are{" "}
            {formatINR(COMBO_PACK_PRICE)} — then {formatINR(COMBO_PACK_PRICE * 2)},{" "}
            {formatINR(COMBO_PACK_PRICE * 3)}, and so on.
          </p>
          <Link href="/shop" className={styles.comboCta}>
            Build your pack
          </Link>
        </aside>

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
                  {design.specialEdition ? (
                    <span className={styles.limitedBadge}>Special</span>
                  ) : null}
                </div>

                <div className={styles.body}>
                  <h3 className={styles.name}>{design.name}</h3>
                  <p className={styles.series}>{design.series}</p>
                  <p className={styles.specs}>
                    {notebookSpecsLine(design, true)}
                  </p>
                  <p className={styles.pageStyle}>
                    {pageOfferLabel(design)}
                    {design.specialEdition ? " · Normal only" : ""}
                  </p>
                  <span className={styles.price}>
                    {design.specialEdition ? (
                      formatINR(SPECIAL_EDITION_PRICE)
                    ) : (
                      <PriceTag
                        price={NORMAL_PRICE}
                        compareAt={NORMAL_COMPARE_AT}
                      />
                    )}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
