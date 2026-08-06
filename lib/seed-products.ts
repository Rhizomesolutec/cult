import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";

export const SEED_PRODUCTS = [
  {
    slug: "legends-line",
    name: "The Legends line",
    series: "Series 01",
    description:
      "Premium hardcovers with finishes inspired by the era when album art was sacred. Your space for lyrics, riffs, and real ideas.",
    price: 60,
    currency: "INR",
    image: "/page1.png",
    stock: 50,
    featured: true,
    active: true,
  },
  {
    slug: "studio-sketch",
    name: "Studio & sketch",
    series: "Series 02",
    description:
      "Lay-flat pages for sketches, setlists, and setpiece notes. Built for dorms, studios, and late-night writing sessions.",
    price: 60,
    currency: "INR",
    image: "/page2.png",
    stock: 50,
    featured: true,
    active: true,
  },
  {
    slug: "tour-edition",
    name: "Tour edition",
    series: "Series 03",
    description:
      "Durable, road-ready build—because ideas don't wait for a desk. Every cover tells a story worth carrying forward.",
    price: 60,
    currency: "INR",
    image: "/page3.png",
    stock: 40,
    featured: true,
    active: true,
  },
  {
    slug: "prince-of-darkness",
    name: "Prince of Darkness",
    series: "The Legends line",
    description:
      "Iconic cover art notebook from the CultScribe Legends collection — raw, real, and written to last.",
    price: 60,
    currency: "INR",
    image: "/cultscribe%205.jpg",
    stock: 30,
    featured: true,
    active: true,
  },
  {
    slug: "gnr-was-here",
    name: "GNR Was Here",
    series: "Studio & sketch",
    description:
      "A cultural-history cover for creators who fill pages with rebellion, lyrics, and late-night ideas.",
    price: 60,
    currency: "INR",
    image: "/cultscribe%208.jpg",
    stock: 30,
    featured: true,
    active: true,
  },
  {
    slug: "minutes-to-midnight",
    name: "Minutes to Midnight",
    series: "Tour edition",
    description:
      "Horizon-line cover art in a durable build — made for tours, studios, and everything in between.",
    price: 60,
    currency: "INR",
    image: "/cultscribe%2022.jpg",
    stock: 25,
    featured: true,
    active: true,
  },
] as const;

export async function seedProductsIfEmpty() {
  await connectDB();
  const count = await Product.countDocuments();
  if (count > 0) {
    await Product.updateMany({}, { $set: { price: 60 } });
    await Product.bulkWrite([
      {
        updateOne: {
          filter: { slug: "legends-line" },
          update: { $set: { image: "/page1.png", price: 60 } },
        },
      },
      {
        updateOne: {
          filter: { slug: "studio-sketch" },
          update: { $set: { image: "/page2.png", price: 60 } },
        },
      },
      {
        updateOne: {
          filter: { slug: "tour-edition" },
          update: { $set: { image: "/page3.png", price: 60 } },
        },
      },
    ]);
    return { seeded: false, count };
  }

  await Product.insertMany([...SEED_PRODUCTS]);
  return { seeded: true, count: SEED_PRODUCTS.length };
}
