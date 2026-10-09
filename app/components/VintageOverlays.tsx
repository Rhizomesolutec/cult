"use client";

import styles from "./VintageOverlays.module.css";

/**
 * Fixed overlay layers: vignette, warm wash, scanlines, sprocket hints, corners.
 */
export function VintageOverlays() {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.vignette} />
      <div className={styles.wash} />
      <div className={styles.scanlines} />
      <div className={styles.sprocketLeft} />
      <div className={styles.sprocketRight} />
      <span className={`${styles.corner} ${styles.cornerTL}`} />
      <span className={`${styles.corner} ${styles.cornerTR}`} />
      <span className={`${styles.corner} ${styles.cornerBL}`} />
      <span className={`${styles.corner} ${styles.cornerBR}`} />
    </div>
  );
}
