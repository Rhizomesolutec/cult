export type NotebookSize = "normal" | "a4";

export type NotebookDesignConfig = {
  designSlug: string;
  name: string;
  series: string;
  subtitle: string;
  description: string;
  image: string;
  /** Slug for the normal-size purchasable variant */
  normalSlug: string;
  /** Slug for the A4 purchasable variant */
  a4Slug: string;
  featured?: boolean;
};

/** Shared specs for every CultScribe notebook. */
export const NOTEBOOK_SPECS = {
  pages: 160,
  gsm: 60,
  paper: "Andhra TruPrint Ultra HB",
  paperShort: "TruPrint Ultra HB",
} as const;

export const PAPER_INTRO =
  "Every CultScribe notebook is filled with Andhra TruPrint Ultra (HB) — premium surface-sized Maplitho paper made for notebooks, journals, textbooks, diaries, and everyday writing.";

export const PAPER_FEATURES = [
  "Top of the line surface-sized paper with sublime formation, aesthetics and print quality",
  "93 brightness paper in white shade",
  "Alkaline sizing for added archival quality that extends the life of the document",
  "Excellent press runnability",
  "Recommended for most jobs with heavy ink coverage",
  "Made with ECF pulp",
] as const;

export function notebookSpecsLine(compact = false): string {
  const paper = compact ? NOTEBOOK_SPECS.paperShort : NOTEBOOK_SPECS.paper;
  return `${NOTEBOOK_SPECS.pages} pages · ${NOTEBOOK_SPECS.gsm} GSM · ${paper}`;
}

/** Seven unique notebook designs — each maps to two purchasable size variants. */
export const NOTEBOOK_DESIGNS: readonly NotebookDesignConfig[] = [
  {
    designSlug: "legends-line",
    name: "The Legends Line",
    series: "Series 01",
    subtitle: "Album-art energy on every cover",
    description:
      "Premium hardcovers inspired by the era when album art was sacred. Your space for lyrics, riffs, and real ideas.",
    image: "/page1.png",
    normalSlug: "legends-line",
    a4Slug: "legends-line-a4",
    featured: true,
  },
  {
    designSlug: "studio-sketch",
    name: "Studio & Sketch",
    series: "Series 02",
    subtitle: "Lay-flat pages for creators",
    description:
      "Built for dorms, studios, and late-night writing sessions — setlists, sketches, and setpiece notes.",
    image: "/page2.png",
    normalSlug: "studio-sketch",
    a4Slug: "studio-sketch-a4",
    featured: true,
  },
  {
    designSlug: "tour-edition",
    name: "Tour Edition",
    series: "Series 03",
    subtitle: "Road-ready durability",
    description:
      "Durable build for ideas that don't wait for a desk. Every cover tells a story worth carrying forward.",
    image: "/page3.png",
    normalSlug: "tour-edition",
    a4Slug: "tour-edition-a4",
    featured: true,
  },
  {
    designSlug: "prince-of-darkness",
    name: "Prince of Darkness",
    series: "The Legends Line",
    subtitle: "Iconic cover, underground spirit",
    description:
      "Raw cover art from the CultScribe Legends collection — written to last, made to be seen.",
    image: "/cultscribe%205.jpg",
    normalSlug: "prince-of-darkness",
    a4Slug: "prince-of-darkness-a4",
  },
  {
    designSlug: "gnr-was-here",
    name: "GNR Was Here",
    series: "Studio & Sketch",
    subtitle: "Cultural history on paper",
    description:
      "A cover for creators who fill pages with rebellion, lyrics, and late-night ideas.",
    image: "/cultscribe%208.jpg",
    normalSlug: "gnr-was-here",
    a4Slug: "gnr-was-here-a4",
  },
  {
    designSlug: "minutes-to-midnight",
    name: "Minutes to Midnight",
    series: "Tour Edition",
    subtitle: "Horizon-line cover art",
    description:
      "Horizon-line artwork in a durable build — made for tours, studios, and everything in between.",
    image: "/cultscribe%2022.jpg",
    normalSlug: "minutes-to-midnight",
    a4Slug: "minutes-to-midnight-a4",
  },
  {
    designSlug: "midnight-sessions",
    name: "Midnight Sessions",
    series: "Series 04",
    subtitle: "Late-night pages, loud ideas",
    description:
      "Dark editorial cover for the hours when the best lines get written — unfinished thoughts welcome.",
    image: "/cultscribe%2011.jpg",
    normalSlug: "midnight-sessions",
    a4Slug: "midnight-sessions-a4",
  },
] as const;

export const DESIGN_COUNT = NOTEBOOK_DESIGNS.length;
export const SIZE_COUNT = 2;
export const VARIANT_COUNT = DESIGN_COUNT * SIZE_COUNT;

export function sizeLabel(size: NotebookSize): string {
  return size === "normal" ? "Normal" : "A4";
}
