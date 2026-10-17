/**
 * CultScribe notebook pricing (INR).
 * Combo applies only to normal-size, non–special-edition books.
 */
export const NORMAL_PRICE = 55;
/** Shown struck-through next to the sale price for standard notebooks. */
export const NORMAL_COMPARE_AT = 60;
export const SPECIAL_EDITION_PRICE = 65;
/** Four normal books together. */
export const COMBO_PACK_SIZE = 4;
export const COMBO_PACK_PRICE = 200;

export const SPECIAL_EDITION_SERIES = "Special Edition";

export function isSpecialEditionSeries(series: string | undefined): boolean {
  return (series || "").trim() === SPECIAL_EDITION_SERIES;
}

export function isComboEligibleProduct(input: {
  size?: string;
  series?: string;
  specialEdition?: boolean;
}): boolean {
  if (input.specialEdition || isSpecialEditionSeries(input.series)) {
    return false;
  }
  const size = (input.size || "normal").toLowerCase();
  return size === "normal";
}

/**
 * Charge for N combo-eligible normal books.
 * Every full pack of 4 costs ₹200 (8 → ₹400, 12 → ₹600);
 * leftover books (1–3) are charged at the normal unit price.
 */
export function comboEligibleTotal(eligibleCount: number): number {
  const n = Math.max(0, Math.floor(eligibleCount));
  if (n <= 0) return 0;
  const packs = Math.floor(n / COMBO_PACK_SIZE);
  const remainder = n % COMBO_PACK_SIZE;
  return packs * COMBO_PACK_PRICE + remainder * NORMAL_PRICE;
}

export function comboSavings(eligibleCount: number): number {
  const n = Math.max(0, Math.floor(eligibleCount));
  if (n < COMBO_PACK_SIZE) return 0;
  return n * NORMAL_PRICE - comboEligibleTotal(n);
}

export type CartPricingLine = {
  quantity: number;
  unitPrice: number;
  size?: string;
  series?: string;
  specialEdition?: boolean;
};

export type CartPricingResult = {
  subtotal: number;
  eligibleCount: number;
  comboApplied: boolean;
  comboSavings: number;
  comboMessage: string;
};

export function priceCartLines(lines: CartPricingLine[]): CartPricingResult {
  let eligibleCount = 0;
  let otherTotal = 0;

  for (const line of lines) {
    const qty = Math.max(0, Math.floor(line.quantity));
    if (qty <= 0) continue;
    if (isComboEligibleProduct(line)) {
      eligibleCount += qty;
    } else {
      otherTotal += line.unitPrice * qty;
    }
  }

  const eligibleTotal = comboEligibleTotal(eligibleCount);
  const savings = comboSavings(eligibleCount);
  const comboApplied = savings > 0;

  let comboMessage = "";
  if (comboApplied) {
    const packs = Math.floor(eligibleCount / COMBO_PACK_SIZE);
    comboMessage = `Combo offer: ${packs}×${COMBO_PACK_SIZE} normal notebooks for ₹${packs * COMBO_PACK_PRICE} — you save ₹${savings}.`;
  } else if (eligibleCount > 0 && eligibleCount < COMBO_PACK_SIZE) {
    const need = COMBO_PACK_SIZE - eligibleCount;
    comboMessage = `Add ${need} more normal notebook${need === 1 ? "" : "s"} for the ${COMBO_PACK_SIZE}-pack at ₹${COMBO_PACK_PRICE}.`;
  }

  return {
    subtotal: eligibleTotal + otherTotal,
    eligibleCount,
    comboApplied,
    comboSavings: savings,
    comboMessage,
  };
}

export function productDisplayPrice(input: {
  specialEdition?: boolean;
  series?: string;
}): { price: number; compareAt: number | null } {
  if (input.specialEdition || isSpecialEditionSeries(input.series)) {
    return { price: SPECIAL_EDITION_PRICE, compareAt: null };
  }
  return { price: NORMAL_PRICE, compareAt: NORMAL_COMPARE_AT };
}
