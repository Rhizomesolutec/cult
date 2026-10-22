export type GalleryItem = {
  common: string;
  binomial: string;
  photo: {
    url: string;
    text: string;
    pos?: string;
    by: string;
  };
};

export type ShowcaseImage = {
  src: string;
  alt: string;
};

const slide = (file: string, alt: string): ShowcaseImage => ({
  src: `/${encodeURI(file)}`,
  alt,
});

export const SHOWCASE_IMAGES: readonly ShowcaseImage[] = [
  slide(
    "cultscribe-3.webp",
    "CultScribe product showcase — Prince of Darkness notebook on a black pedestal with blurred titles in the background.",
  ),
  slide(
    "cultscribe-5.webp",
    "CultScribe product showcase — Prince of Darkness cover art on a pedestal with additional notebooks behind.",
  ),
  slide(
    "cultscribe-6.webp",
    "CultScribe product lineup — GNR Was Here notebook standing among zines and cassette tapes on a dark surface.",
  ),
  slide(
    "cultscribe-8.webp",
    "CultScribe product showcase — GNR Was Here notebook on a black pedestal with blurred CultScribe titles behind.",
  ),
  slide(
    "cultscribe-9.webp",
    "CultScribe poster collection — four notebook covers scattered on a black background.",
  ),
  slide(
    "cultscribe-11.webp",
    "CultScribe flat lay — notebooks and cassette tapes on a dark surface with GNR Was Here standing upright.",
  ),
  slide(
    "cultscribe12.webp",
    "CultScribe flat lay — Minutes to Midnight, Prince of Darkness, and Dark Side notebooks with vintage cassettes.",
  ),
  slide(
    "cultscribe-16.webp",
    "CultScribe poster spread — four iconic notebook covers arranged on a black background.",
  ),
  slide(
    "cultscribe-19.webp",
    "CultScribe collection — four notebooks and three cassette tapes on a dark matte surface.",
  ),
  slide(
    "cultscribe-20.webp",
    "CultScribe product showcase — Minutes to Midnight notebook in focus with blurred titles behind.",
  ),
  slide(
    "cultscribe-22.webp",
    "CultScribe Minutes to Midnight notebook cover — singer silhouette with horizon line artwork.",
  ),
];

const galleryItem = (
  file: string,
  common: string,
  binomial: string,
  alt: string,
  pos?: string,
): GalleryItem => ({
  common,
  binomial,
  photo: {
    url: `/${encodeURI(file)}`,
    text: alt,
    pos,
    by: "CultScribe",
  },
});

/** Lifestyle / product showcase shots (legacy). */
export const SHOWCASE_GALLERY_ITEMS: readonly GalleryItem[] = [
  galleryItem(
    "cultscribe-3.webp",
    "Prince of Darkness",
    "The Legends line",
    "CultScribe product showcase — Prince of Darkness notebook on a black pedestal with blurred titles in the background.",
    "50% 40%",
  ),
  galleryItem(
    "cultscribe-5.webp",
    "Prince of Darkness",
    "Pedestal showcase",
    "CultScribe product showcase — Prince of Darkness cover art on a pedestal with additional notebooks behind.",
    "50% 35%",
  ),
  galleryItem(
    "cultscribe-6.webp",
    "GNR Was Here",
    "Studio & sketch",
    "CultScribe product lineup — GNR Was Here notebook standing among zines and cassette tapes on a dark surface.",
    "45% 50%",
  ),
  galleryItem(
    "cultscribe-8.webp",
    "GNR Was Here",
    "Pedestal showcase",
    "CultScribe product showcase — GNR Was Here notebook on a black pedestal with blurred CultScribe titles behind.",
    "50% 40%",
  ),
  galleryItem(
    "cultscribe-9.webp",
    "Poster collection",
    "Four iconic covers",
    "CultScribe poster collection — four notebook covers scattered on a black background.",
    "center",
  ),
  galleryItem(
    "cultscribe-11.webp",
    "GNR Was Here",
    "Flat lay",
    "CultScribe flat lay — notebooks and cassette tapes on a dark surface with GNR Was Here standing upright.",
    "55% 45%",
  ),
  galleryItem(
    "cultscribe12.webp",
    "Dark Side",
    "Minutes to Midnight · Prince of Darkness",
    "CultScribe flat lay — Minutes to Midnight, Prince of Darkness, and Dark Side notebooks with vintage cassettes.",
    "50% 50%",
  ),
  galleryItem(
    "cultscribe-16.webp",
    "Poster spread",
    "Classic rock covers",
    "CultScribe poster spread — four iconic notebook covers arranged on a black background.",
    "center",
  ),
  galleryItem(
    "cultscribe-19.webp",
    "The collection",
    "Notebooks & cassettes",
    "CultScribe collection — four notebooks and three cassette tapes on a dark matte surface.",
    "50% 45%",
  ),
  galleryItem(
    "cultscribe-20.webp",
    "Minutes to Midnight",
    "Pedestal showcase",
    "CultScribe product showcase — Minutes to Midnight notebook in focus with blurred titles behind.",
    "50% 35%",
  ),
  galleryItem(
    "cultscribe-22.webp",
    "Minutes to Midnight",
    "Cover art detail",
    "CultScribe Minutes to Midnight notebook cover — singer silhouette with horizon line artwork.",
    "50% 30%",
  ),
];

/**
 * Collection notebook covers for the home poster stack —
 * same books shown in Explore Collection.
 */
export const COLLECTION_GALLERY_ITEMS: readonly GalleryItem[] = [
  {
    common: "GNR",
    binomial: "Series 01 · Unruled only",
    photo: {
      url: "/page1.webp",
      text: "CultScribe The Legends Line notebook cover — ruled pages",
      by: "CultScribe",
    },
  },
  {
    common: "Pink Floyd",
    binomial: "Series 02 · Unruled only",
    photo: {
      url: "/page2.webp",
      text: "CultScribe Studio & Sketch notebook cover — unruled pages",
      by: "CultScribe",
    },
  },
  {
    common: "Ozzy",
    binomial: "Series 03 · Unruled only",
    photo: {
      url: "/page3.webp",
      text: "CultScribe Tour Edition notebook cover — ruled pages",
      by: "CultScribe",
    },
  },
  {
    common: "Linkin Park",
    binomial: "Tour Edition · Unruled only",
    photo: {
      url: "/minutes-to-midnight.webp",
      text: "CultScribe Linkin Park Minutes to Midnight notebook — unruled pages",
      pos: "50% 30%",
      by: "CultScribe",
    },
  },
  {
    common: "Never Free, Never Me",
    binomial: "New Drop · Ruled only",
    photo: {
      url: "/cultscribenew.webp",
      text: "CultScribe Never Free, Never Me notebook — ruled pages",
      pos: "50% 40%",
      by: "CultScribe",
    },
  },
  {
    common: "Eminem",
    binomial: "Special Edition · Ruled & Unruled",
    photo: {
      url: "/special-book-keep-it-raw.webp",
      text: "CultScribe Keep It Raw special edition — ruled pages",
      pos: "50% 35%",
      by: "CultScribe",
    },
  },
  {
    common: "Black Sabbath",
    binomial: "Special Edition · Ruled & Unruled",
    photo: {
      url: "/special-book-metal-stage.webp",
      text: "CultScribe Metal Stage special edition — ruled pages",
      pos: "50% 35%",
      by: "CultScribe",
    },
  },
];
