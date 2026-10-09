import { Schema, models, model, type HydratedDocument, type Model } from "mongoose";

export type ProductSize = "normal" | "a4";

export type ProductAttrs = {
  slug: string;
  name: string;
  series: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  stock: number;
  featured: boolean;
  active: boolean;
  /** Groups size variants of the same notebook design */
  designSlug?: string;
  size?: ProductSize;
};

const ProductSchema = new Schema<ProductAttrs>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    series: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    image: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    designSlug: { type: String, index: true },
    size: { type: String, enum: ["normal", "a4"] },
  },
  { timestamps: true },
);

export type ProductDocument = HydratedDocument<ProductAttrs>;
export type ProductModel = Model<ProductAttrs>;

export const Product: ProductModel =
  (models.Product as ProductModel) ||
  model<ProductAttrs>("Product", ProductSchema);
