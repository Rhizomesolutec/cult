import { formatINR } from "@/lib/commerce-client";
import styles from "./PriceTag.module.css";

type PriceTagProps = {
  price: number;
  compareAt?: number | null;
  className?: string;
};

/** Sale price with optional struck-through compare-at (e.g. ₹55 with ₹60 crossed). */
export function PriceTag({ price, compareAt, className }: PriceTagProps) {
  const showCompare =
    compareAt != null && Number(compareAt) > Number(price);

  return (
    <span className={[styles.wrap, className].filter(Boolean).join(" ")}>
      {showCompare ? (
        <span className={styles.compare} aria-label={`Was ${formatINR(compareAt)}`}>
          {formatINR(compareAt)}
        </span>
      ) : null}
      <span className={styles.price}>{formatINR(price)}</span>
    </span>
  );
}
