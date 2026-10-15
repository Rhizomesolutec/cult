export type NotebookSize = "normal" | "a4";

export type NotebookPageStyle = "lined" | "plain";

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
  /** Interior ruling — lined or plain (unruled) pages */
  pageStyle: NotebookPageStyle;
  featured?: boolean;
  limitedEdition?: boolean;
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

export function pageStyleLabel(style: NotebookPageStyle): string {
  return style === "lined" ? "Lined pages" : "Plain pages";
}

export function notebookSpecsLine(
  designOrCompact?: Pick<NotebookDesignConfig, "pageStyle"> | boolean,
  compact = false,
): string {
  const design =
    typeof designOrCompact === "object" ? designOrCompact : undefined;
  const isCompact =
    typeof designOrCompact === "boolean" ? designOrCompact : compact;
  const paper = isCompact ? NOTEBOOK_SPECS.paperShort : NOTEBOOK_SPECS.paper;
  const pages = design
    ? `${NOTEBOOK_SPECS.pages} ${design.pageStyle === "lined" ? "lined" : "plain"} pages`
    : `${NOTEBOOK_SPECS.pages} pages`;
  return `${pages} · ${NOTEBOOK_SPECS.gsm} GSM · ${paper}`;
}

/**
 * Notebook designs — each maps to two purchasable size variants.
 * Lined: Legends Line, Tour Edition, Minutes to Midnight, Never Free Never Me,
 * and both Limited Edition covers. All others are plain (unruled).
 */
export const NOTEBOOK_DESIGNS: readonly NotebookDesignConfig[] = [
  {
    designSlug: "legends-line",
    name: "The Legends Line",
    series: "Series 01",
    subtitle: "Album-art energy on every cover",
    description:
      "Premium hardcovers inspired by the era when album art was sacred. Your space for lyrics, riffs, and real ideas. Interior: lined pages for structured writing.",
    image: "/page1.png",
    normalSlug: "legends-line",
    a4Slug: "legends-line-a4",
    pageStyle: "lined",
    featured: true,
  },
  {
    designSlug: "studio-sketch",
    name: "Studio & Sketch",
    series: "Series 02",
    subtitle: "Lay-flat pages for creators",
    description:
      "Built for dorms, studios, and late-night writing sessions — setlists, sketches, and setpiece notes. Interior: plain (unruled) pages for freeform work.",
    image: "/page2.png",
    normalSlug: "studio-sketch",
    a4Slug: "studio-sketch-a4",
    pageStyle: "plain",
    featured: true,
  },
  {
    designSlug: "tour-edition",
    name: "Tour Edition",
    series: "Series 03",
    subtitle: "Road-ready durability",
    description:
      "Durable build for ideas that don't wait for a desk. Every cover tells a story worth carrying forward. Interior: lined pages for notes on the road.",
    image: "/page3.png",
    normalSlug: "tour-edition",
    a4Slug: "tour-edition-a4",
    pageStyle: "lined",
    featured: true,
  },
  {
    designSlug: "prince-of-darkness",
    name: "Prince of Darkness",
    series: "The Legends Line",
    subtitle: "Iconic cover, underground spirit",
    description:
      "Raw cover art from the CultScribe Legends collection — written to last, made to be seen. Interior: plain pages.",
    image: "/cultscribe%205.jpg",
    normalSlug: "prince-of-darkness",
    a4Slug: "prince-of-darkness-a4",
    pageStyle: "plain",
  },
  {
    designSlug: "gnr-was-here",
    name: "GNR Was Here",
    series: "Studio & Sketch",
    subtitle: "Cultural history on paper",
    description:
      "A cover for creators who fill pages with rebellion, lyrics, and late-night ideas. Interior: plain pages.",
    image: "/cultscribe%208.jpg",
    normalSlug: "gnr-was-here",
    a4Slug: "gnr-was-here-a4",
    pageStyle: "plain",
  },
  {
    designSlug: "minutes-to-midnight",
    name: "Minutes to Midnight",
    series: "Tour Edition",
    subtitle: "Horizon-line cover art",
    description:
      "Horizon-line artwork in a durable build — made for tours, studios, and everything in between. Interior: lined pages.",
    image: "/cultscribe%2022.jpg",
    normalSlug: "minutes-to-midnight",
    a4Slug: "minutes-to-midnight-a4",
    pageStyle: "lined",
  },
  {
    designSlug: "midnight-sessions",
    name: "Midnight Sessions",
    series: "Series 04",
    subtitle: "Late-night pages, loud ideas",
    description:
      "Dark editorial cover for the hours when the best lines get written — unfinished thoughts welcome. Interior: plain pages.",
    image: "/cultscribe%2011.jpg",
    normalSlug: "midnight-sessions",
    a4Slug: "midnight-sessions-a4",
    pageStyle: "plain",
  },
  {
    designSlug: "never-free-never-me",
    name: "Never Free, Never Me",
    series: "New Drop",
    subtitle: "Raw. Real. Written.",
    description:
      "High-contrast CultScribe cover — Never Free, Never Me — for essentials-only notebooks. Interior: lined pages for capturing thoughts line by line.",
    image: "/cultscribenew.jpeg",
    normalSlug: "never-free-never-me",
    a4Slug: "never-free-never-me-a4",
    pageStyle: "lined",
    featured: true,
  },
  {
    designSlug: "limited-keep-it-raw",
    name: "Keep It Raw",
    series: "Limited Edition",
    subtitle: "Special Edition · Metal Book Series",
    description:
      "Limited special-edition cover — horns-up energy, Keep It Raw branding. Scarce run. Interior: lined pages.",
    image: "/limited-edition-design-1.jpg",
    normalSlug: "limited-keep-it-raw",
    a4Slug: "limited-keep-it-raw-a4",
    pageStyle: "lined",
    limitedEdition: true,
    featured: true,
  },
  {
    designSlug: "limited-metal-stage",
    name: "Metal Stage",
    series: "Limited Edition",
    subtitle: "Special Edition · Metal Book Series",
    description:
      "Limited special-edition cover — dual-stage metal illustration from the CultScribe Metal Book Series. Scarce run. Interior: lined pages.",
    image: "/limited-edition-2-close.jpg",
    normalSlug: "limited-metal-stage",
    a4Slug: "limited-metal-stage-a4",
    pageStyle: "lined",
    limitedEdition: true,
    featured: true,
  },
] as const;

/** Extra art for the Limited Edition homepage section (not product SKUs). */
export const LIMITED_EDITION_SHOWCASE = {
  products: [
    {
      designSlug: "limited-keep-it-raw",
      image: "/limited-edition-design-1.jpg",
      flatArt: "/limited-edition-1-close.jpg",
      back: "/limited-edition-1-alt.jpg",
    },
    {
      designSlug: "limited-metal-stage",
      image: "/limited-edition-2-close.jpg",
      flatArt: "/limited-edition-2-alt.jpg",
      back: "/limited-edition-2-detail.jpg",
    },
  ],
  designShots: [
    {
      src: "/limited-edition-design-2.jpg",
      alt: "CultScribe Limited Edition Metal Book Series — both special covers",
    },
    {
      src: "/limited-edition-design-4.jpg",
      alt: "CultScribe Limited Edition pair — Metal Stage and Keep It Raw side by side",
    },
    {
      src: "/limited-edition-design-3.jpg",
      alt: "CultScribe Limited Edition Metal Stage cover art",
    },
  ],
} as const;

export const LIMITED_EDITION_DESIGNS = NOTEBOOK_DESIGNS.filter(
  (d) => d.limitedEdition,
);

export const DESIGN_COUNT = NOTEBOOK_DESIGNS.length;
export const SIZE_COUNT = 2;
export const VARIANT_COUNT = DESIGN_COUNT * SIZE_COUNT;

export function sizeLabel(size: NotebookSize): string {
  return size === "normal" ? "Normal" : "A4";
}
