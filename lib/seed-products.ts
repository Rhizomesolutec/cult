import { connectDB } from "@/lib/db";
import {
  NOTEBOOK_DESIGNS,
  notebookSpecsLine,
} from "@/lib/config/notebook-designs";
import { Product } from "@/lib/models/Product";

/** All notebooks (standard + limited) are ₹65 including at payment time. */
const BOOK_PRICE = 65;

function priceForDesign(_limitedEdition?: boolean): number {
  return BOOK_PRICE;
}

function productDescription(
  design: (typeof NOTEBOOK_DESIGNS)[number],
  a4 = false,
): string {
  const base = `${design.description} ${notebookSpecsLine(design)}.`;
  if (!a4) return base;
  return `${base} Available in A4 format for larger spreads and heavier writing sessions.`;
}

function buildSeedProducts() {
  const products = [];

  for (const design of NOTEBOOK_DESIGNS) {
    const price = priceForDesign(design.limitedEdition);
    products.push({
      slug: design.normalSlug,
      name: design.name,
      series: design.series,
      description: productDescription(design),
      price,
      currency: "INR",
      image: design.image,
      stock: design.limitedEdition ? 25 : 50,
      featured: Boolean(design.featured),
      active: true,
      designSlug: design.designSlug,
      size: "normal" as const,
    });

    products.push({
      slug: design.a4Slug,
      name: `${design.name} — A4`,
      series: design.series,
      description: productDescription(design, true),
      price,
      currency: "INR",
      image: design.image,
      stock: 0,
      featured: Boolean(design.featured),
      active: true,
      designSlug: design.designSlug,
      size: "a4" as const,
    });
  }

  return products;
}

export const SEED_PRODUCTS = buildSeedProducts();

export async function seedProductsIfEmpty() {
  await connectDB();
  const count = await Product.countDocuments();

  if (count === 0) {
    await Product.insertMany([...SEED_PRODUCTS]);
    return { seeded: true, count: SEED_PRODUCTS.length };
  }

  await Product.updateMany({}, { $set: { price: BOOK_PRICE } });
  /** A4 sizes are currently unavailable. */
  await Product.updateMany({ size: "a4" }, { $set: { stock: 0 } });
  await Product.updateMany(
    { slug: { $regex: /-a4$/ } },
    { $set: { stock: 0 } },
  );

  for (const design of NOTEBOOK_DESIGNS) {
    const price = priceForDesign(design.limitedEdition);
    await Product.updateOne(
      { slug: design.normalSlug },
      {
        $set: {
          image: design.image,
          price,
          designSlug: design.designSlug,
          size: "normal",
          name: design.name,
          series: design.series,
          description: productDescription(design),
          featured: Boolean(design.featured),
          active: true,
        },
        $setOnInsert: {
          stock: design.limitedEdition ? 25 : 50,
          currency: "INR",
        },
      },
      { upsert: true },
    );

    await Product.updateOne(
      { slug: design.a4Slug },
      {
        $set: {
          image: design.image,
          price,
          designSlug: design.designSlug,
          size: "a4",
          name: `${design.name} — A4`,
          series: design.series,
          description: productDescription(design, true),
          stock: 0,
          featured: Boolean(design.featured),
          active: true,
        },
        $setOnInsert: {
          currency: "INR",
        },
      },
      { upsert: true },
    );
  }

  return { seeded: false, count: await Product.countDocuments() };
}
