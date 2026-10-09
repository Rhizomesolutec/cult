import { connectDB } from "@/lib/db";
import { NOTEBOOK_DESIGNS } from "@/lib/config/notebook-designs";
import { Product } from "@/lib/models/Product";

const BASE_PRICE = 60;

function buildSeedProducts() {
  const products = [];

  for (const design of NOTEBOOK_DESIGNS) {
    products.push({
      slug: design.normalSlug,
      name: design.name,
      series: design.series,
      description: design.description,
      price: BASE_PRICE,
      currency: "INR",
      image: design.image,
      stock: 50,
      featured: Boolean(design.featured),
      active: true,
      designSlug: design.designSlug,
      size: "normal" as const,
    });

    products.push({
      slug: design.a4Slug,
      name: `${design.name} — A4`,
      series: design.series,
      description: `${design.description} Available in A4 format for larger spreads and heavier writing sessions.`,
      price: BASE_PRICE,
      currency: "INR",
      image: design.image,
      stock: 40,
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

  await Product.updateMany({}, { $set: { price: BASE_PRICE } });

  for (const design of NOTEBOOK_DESIGNS) {
    await Product.updateOne(
      { slug: design.normalSlug },
      {
        $set: {
          image: design.image,
          price: BASE_PRICE,
          designSlug: design.designSlug,
          size: "normal",
          name: design.name,
          series: design.series,
          description: design.description,
        },
      },
      { upsert: false },
    );

    await Product.updateOne(
      { slug: design.a4Slug },
      {
        $set: {
          image: design.image,
          price: BASE_PRICE,
          designSlug: design.designSlug,
          size: "a4",
          name: `${design.name} — A4`,
          series: design.series,
          description: `${design.description} Available in A4 format for larger spreads and heavier writing sessions.`,
          stock: 40,
          featured: Boolean(design.featured),
          active: true,
        },
      },
      { upsert: true },
    );
  }

  return { seeded: false, count };
}
