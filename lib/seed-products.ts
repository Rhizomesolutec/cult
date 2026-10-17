import { connectDB } from "@/lib/db";
import {
  NOTEBOOK_DESIGNS,
  notebookSpecsLine,
} from "@/lib/config/notebook-designs";
import { Product } from "@/lib/models/Product";
import {
  NORMAL_PRICE,
  SPECIAL_EDITION_PRICE,
  SPECIAL_EDITION_SERIES,
} from "@/lib/pricing";

function priceForDesign(specialEdition?: boolean): number {
  return specialEdition ? SPECIAL_EDITION_PRICE : NORMAL_PRICE;
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
    const price = priceForDesign(design.specialEdition);
    products.push({
      slug: design.normalSlug,
      name: design.name,
      series: design.series,
      description: productDescription(design),
      price,
      currency: "INR",
      image: design.image,
      stock: design.specialEdition ? 25 : 50,
      featured: Boolean(design.featured),
      active: true,
      designSlug: design.designSlug,
      size: "normal" as const,
    });

    // Special Edition is normal-size only — keep A4 SKU inactive / zero stock.
    products.push({
      slug: design.a4Slug,
      name: `${design.name} — A4`,
      series: design.series,
      description: productDescription(design, true),
      price: design.specialEdition ? SPECIAL_EDITION_PRICE : NORMAL_PRICE,
      currency: "INR",
      image: design.image,
      stock: 0,
      featured: false,
      active: !design.specialEdition,
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

  // Migrate old "Limited Edition" series label.
  await Product.updateMany(
    { series: "Limited Edition" },
    { $set: { series: SPECIAL_EDITION_SERIES } },
  );

  /** A4 sizes are currently unavailable; Special Edition has no A4. */
  await Product.updateMany({ size: "a4" }, { $set: { stock: 0 } });
  await Product.updateMany(
    { slug: { $regex: /-a4$/ } },
    { $set: { stock: 0 } },
  );

  for (const design of NOTEBOOK_DESIGNS) {
    const price = priceForDesign(design.specialEdition);
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
          stock: design.specialEdition ? 25 : 50,
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
          price: design.specialEdition ? SPECIAL_EDITION_PRICE : NORMAL_PRICE,
          designSlug: design.designSlug,
          size: "a4",
          name: `${design.name} — A4`,
          series: design.series,
          description: productDescription(design, true),
          stock: 0,
          featured: false,
          active: !design.specialEdition,
        },
        $setOnInsert: {
          currency: "INR",
        },
      },
      { upsert: true },
    );
  }

  // Ensure series-based prices stay correct for any leftover docs.
  await Product.updateMany(
    { series: SPECIAL_EDITION_SERIES, size: "normal" },
    { $set: { price: SPECIAL_EDITION_PRICE, active: true } },
  );
  await Product.updateMany(
    { series: SPECIAL_EDITION_SERIES, size: "a4" },
    { $set: { price: SPECIAL_EDITION_PRICE, stock: 0, active: false } },
  );
  await Product.updateMany(
    {
      series: { $ne: SPECIAL_EDITION_SERIES },
      $or: [{ size: "normal" }, { size: { $exists: false } }],
    },
    { $set: { price: NORMAL_PRICE } },
  );
  await Product.updateMany(
    { series: { $ne: SPECIAL_EDITION_SERIES }, size: "a4" },
    { $set: { price: NORMAL_PRICE, stock: 0 } },
  );

  return { seeded: false, count: await Product.countDocuments() };
}
