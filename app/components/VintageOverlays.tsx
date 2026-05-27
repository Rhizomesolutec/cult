"use client";

import styles from "./VintageOverlays.module.css";

/**
 * Fixed “old film / analog booth” layers: vignette, warm wash, grain, scanlines,
 * sprocket hints, corner brackets. Sits below the header (z-index) and does not
 * intercept clicks.
 */
export function VintageOverlays() {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.vignette} />
      <div className={styles.wash} />
      <div className={styles.grain} />
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
