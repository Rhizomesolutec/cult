import { connectDB } from "@/lib/db";
import {
  NOTEBOOK_DESIGNS,
  notebookSpecsLine,
  offersBothPageStyles,
  unruledProductSlug,
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
      name: offersBothPageStyles(design)
        ? `${design.name} — Ruled`
        : design.name,
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
    if (offersBothPageStyles(design)) {
      products.push({
        slug: unruledProductSlug(design.normalSlug),
        name: `${design.name} — Unruled`,
        series: design.series,
        description: `${productDescription(design)} Interior option: unruled pages.`,
        price,
        currency: "INR",
        image: design.image,
        stock: design.specialEdition ? 25 : 50,
        featured: false,
        active: true,
        designSlug: design.designSlug,
        size: "normal" as const,
      });
    }

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

/** Bump when catalog images, prices, or SKUs must be written to Mongo once. */
const CATALOG_VERSION = "webp-v1";

async function readCatalogVersion(): Promise<string | null> {
  const doc = await Product.db.collection("catalogmeta").findOne({ key: "products" });
  const version = doc?.version;
  return typeof version === "string" ? version : null;
}

async function writeCatalogVersion() {
  await Product.db.collection("catalogmeta").updateOne(
    { key: "products" },
    { $set: { version: CATALOG_VERSION, updatedAt: new Date() } },
    { upsert: true },
  );
}

export async function seedProductsIfEmpty() {
  await connectDB();

  if ((await readCatalogVersion()) === CATALOG_VERSION) {
    return { seeded: false, skipped: true };
  }

  const count = await Product.countDocuments();

  if (count === 0) {
    await Product.insertMany([...SEED_PRODUCTS]);
    await writeCatalogVersion();
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

    if (offersBothPageStyles(design)) {
      await Product.updateOne(
        { slug: unruledProductSlug(design.normalSlug) },
        {
          $set: {
            image: design.image,
            price,
            designSlug: design.designSlug,
            size: "normal",
            name: `${design.name} — Unruled`,
            series: design.series,
            description: `${productDescription(design)} Interior option: unruled pages.`,
            featured: false,
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
        { slug: design.normalSlug },
        { $set: { name: `${design.name} — Ruled` } },
      );
    }

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

  await Product.updateMany(
    {
      slug: {
        $in: [
          "prince-of-darkness",
          "prince-of-darkness-a4",
          "gnr-was-here",
          "gnr-was-here-a4",
          "midnight-sessions",
          "midnight-sessions-a4",
        ],
      },
    },
    { $set: { active: false, stock: 0 } },
  );

  await writeCatalogVersion();
  return { seeded: false, count: await Product.countDocuments() };
}
