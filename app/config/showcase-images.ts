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
