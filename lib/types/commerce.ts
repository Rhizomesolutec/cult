import type { Types } from "mongoose";

export type ProductSize = "normal" | "a4";

export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  series: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  stock: number;
  featured: boolean;
  designSlug?: string;
  size?: ProductSize;
};

export type CartItemDTO = {
  productId: string;
  quantity: number;
  name: string;
  series: string;
  image: string;
  price: number;
  currency: string;
  stock: number;
  lineTotal: number;
};

export type CartDTO = {
  items: CartItemDTO[];
  itemCount: number;
  subtotal: number;
  currency: string;
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
  return {
    id: String(p._id),
    slug: p.slug,
    name: p.name,
    series: p.series,
    description: p.description,
    price: p.price,
    currency: p.currency || "INR",
    image: p.image,
    stock: p.stock,
    featured: Boolean(p.featured),
    designSlug: p.designSlug,
    size: p.size,
  };
}
