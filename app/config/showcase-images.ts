import type { GalleryItem } from "@/components/ui/circular-gallery";

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
    "cultscribe 3.jpg.jpeg",
    "CultScribe product showcase — Prince of Darkness notebook on a black pedestal with blurred titles in the background.",
  ),
  slide(
    "cultscribe 5.jpg",
    "CultScribe product showcase — Prince of Darkness cover art on a pedestal with additional notebooks behind.",
  ),
  slide(
    "cultscribe 6.jpg.jpeg",
    "CultScribe product lineup — GNR Was Here notebook standing among zines and cassette tapes on a dark surface.",
  ),
  slide(
    "cultscribe 8.jpg",
    "CultScribe product showcase — GNR Was Here notebook on a black pedestal with blurred CultScribe titles behind.",
  ),
  slide(
    "cultscribe 9.jpg",
    "CultScribe poster collection — four notebook covers scattered on a black background.",
  ),
  slide(
    "cultscribe 11.jpg",
    "CultScribe flat lay — notebooks and cassette tapes on a dark surface with GNR Was Here standing upright.",
  ),
  slide(
    "cultscribe12.jpg",
    "CultScribe flat lay — Minutes to Midnight, Prince of Darkness, and Dark Side notebooks with vintage cassettes.",
  ),
  slide(
    "cultscribe 16.jpg",
    "CultScribe poster spread — four iconic notebook covers arranged on a black background.",
  ),
  slide(
    "cultscribe 19.jpg",
    "CultScribe collection — four notebooks and three cassette tapes on a dark matte surface.",
  ),
  slide(
    "cultscribe 20.jpg",
    "CultScribe product showcase — Minutes to Midnight notebook in focus with blurred titles behind.",
  ),
  slide(
    "cultscribe 22.jpg",
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

export const SHOWCASE_GALLERY_ITEMS: readonly GalleryItem[] = [
  galleryItem(
    "cultscribe 3.jpg.jpeg",
    "Prince of Darkness",
    "The Legends line",
    "CultScribe product showcase — Prince of Darkness notebook on a black pedestal with blurred titles in the background.",
    "50% 40%",
  ),
  galleryItem(
    "cultscribe 5.jpg",
    "Prince of Darkness",
    "Pedestal showcase",
    "CultScribe product showcase — Prince of Darkness cover art on a pedestal with additional notebooks behind.",
    "50% 35%",
  ),
  galleryItem(
    "cultscribe 6.jpg.jpeg",
    "GNR Was Here",
    "Studio & sketch",
    "CultScribe product lineup — GNR Was Here notebook standing among zines and cassette tapes on a dark surface.",
    "45% 50%",
  ),
  galleryItem(
    "cultscribe 8.jpg",
    "GNR Was Here",
    "Pedestal showcase",
    "CultScribe product showcase — GNR Was Here notebook on a black pedestal with blurred CultScribe titles behind.",
    "50% 40%",
  ),
  galleryItem(
    "cultscribe 9.jpg",
    "Poster collection",
    "Four iconic covers",
    "CultScribe poster collection — four notebook covers scattered on a black background.",
    "center",
  ),
  galleryItem(
    "cultscribe 11.jpg",
    "GNR Was Here",
    "Flat lay",
    "CultScribe flat lay — notebooks and cassette tapes on a dark surface with GNR Was Here standing upright.",
    "55% 45%",
  ),
  galleryItem(
    "cultscribe12.jpg",
    "Dark Side",
    "Minutes to Midnight · Prince of Darkness",
    "CultScribe flat lay — Minutes to Midnight, Prince of Darkness, and Dark Side notebooks with vintage cassettes.",
    "50% 50%",
  ),
  galleryItem(
    "cultscribe 16.jpg",
    "Poster spread",
    "Classic rock covers",
    "CultScribe poster spread — four iconic notebook covers arranged on a black background.",
    "center",
  ),
  galleryItem(
    "cultscribe 19.jpg",
    "The collection",
    "Notebooks & cassettes",
    "CultScribe collection — four notebooks and three cassette tapes on a dark matte surface.",
    "50% 45%",
  ),
  galleryItem(
    "cultscribe 20.jpg",
    "Minutes to Midnight",
    "Pedestal showcase",
    "CultScribe product showcase — Minutes to Midnight notebook in focus with blurred titles behind.",
    "50% 35%",
  ),
  galleryItem(
    "cultscribe 22.jpg",
    "Minutes to Midnight",
    "Cover art detail",
    "CultScribe Minutes to Midnight notebook cover — singer silhouette with horizon line artwork.",
    "50% 30%",
  ),
];
