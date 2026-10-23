import type { Types } from "mongoose";
import {
  isSpecialEditionSeries,
  productDisplayPrice,
} from "@/lib/pricing";

export type ProductSize = "normal" | "a4";

export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  series: string;
  description: string;
  price: number;
  /** List/MRP shown struck-through when higher than `price`. */
  compareAtPrice?: number | null;
  currency: string;
  image: string;
  stock: number;
  featured: boolean;
  designSlug?: string;
  size?: ProductSize;
  specialEdition?: boolean;
};

export type CartItemDTO = {
  productId: string;
  quantity: number;
  name: string;
  series: string;
  image: string;
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  stock: number;
  lineTotal: number;
  size?: ProductSize;
  specialEdition?: boolean;
};

export type CartDTO = {
  items: CartItemDTO[];
  itemCount: number;
  subtotal: number;
  currency: string;
  comboApplied?: boolean;
  comboSavings?: number;
  comboEligibleCount?: number;
  comboMessage?: string;
  /** Shipping added on top of the book subtotal. */
  deliveryCharge: number;
  /** Books plus delivery. */
  total: number;
};

export function toProductDTO(p: {
  _id: Types.ObjectId | string;
  slug: string;
  name: string;
  series: string;
  description: string;
  price: number;
  currency?: string;
  image: string;
  stock: number;
  featured?: boolean;
  designSlug?: string;
  size?: ProductSize;
}): ProductDTO {
  const specialEdition = isSpecialEditionSeries(p.series);
  const display = productDisplayPrice({ specialEdition, series: p.series });
  return {
    id: String(p._id),
    slug: p.slug,
    name: p.name,
    series: p.series,
    description: p.description,
    price: p.price,
    compareAtPrice: display.compareAt,
    currency: p.currency || "INR",
    image: p.image,
    stock: p.stock,
    featured: Boolean(p.featured),
    designSlug: p.designSlug,
    size: p.size,
    specialEdition,
  };
}
