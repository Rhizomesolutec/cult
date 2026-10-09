"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  DESIGN_COUNT,
  SIZE_COUNT,
  VARIANT_COUNT,
} from "@/lib/config/notebook-designs";
import styles from "./CollectionStats.module.css";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const STATS = [
  {
    value: String(DESIGN_COUNT).padStart(2, "0"),
    label: "Unique designs",
  },
  {
    value: String(SIZE_COUNT).padStart(2, "0"),
    label: "Size options",
  },
  {
    value: String(VARIANT_COUNT).padStart(2, "0"),
    label: "Ways to write",
  },
] as const;

export function CollectionStats() {
  const reduceMotion = useReducedMotion();

  return (
    <section className={styles.section} aria-label="Collection overview">
      <div className={styles.inner}>
        {STATS.map((stat, index) => (
          <motion.div
            key={stat.label}
            className={styles.stat}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.6,
              delay: reduceMotion ? 0 : index * 0.1,
              ease: EASE_OUT,
            }}
          >
            <span className={styles.value}>{stat.value}</span>
            <span className={styles.label}>{stat.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
