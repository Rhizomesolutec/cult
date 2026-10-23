import {
  NOTEBOOK_DESIGNS,
  notebookSpecsLine,
  offersBothPageStyles,
  unruledProductSlug,
  type NotebookDesignConfig,
} from "@/lib/config/notebook-designs";
import {
  NORMAL_COMPARE_AT,
  NORMAL_PRICE,
  SPECIAL_EDITION_PRICE,
} from "@/lib/pricing";
import type { ProductDTO } from "@/lib/types/commerce";

export function catalogDescription(
  design: Pick<NotebookDesignConfig, "description" | "pageStyle" | "pageStyles">,
  a4 = false,
): string {
  const base = `${design.description} ${notebookSpecsLine(design)}.`;
  if (!a4) return base;
  return `${base} Available in A4 format for larger spreads and heavier writing sessions.`;
}

function priceFor(specialEdition?: boolean) {
  return specialEdition ? SPECIAL_EDITION_PRICE : NORMAL_PRICE;
}

type CatalogDraft = ProductDTO & { order: number };

/** Shop catalog shipped with the app so pages render before the database answers. */
export function staticCatalog(): ProductDTO[] {
  const drafts: CatalogDraft[] = [];
  let order = 0;

  for (const design of NOTEBOOK_DESIGNS) {
    const price = priceFor(design.specialEdition);
    const compareAtPrice = design.specialEdition ? null : NORMAL_COMPARE_AT;
    const both = offersBothPageStyles(design);

    const push = (product: Omit<CatalogDraft, "currency">) => {
      drafts.push({ ...product, currency: "INR" });
    };

    push({
      order: order++,
      id: design.normalSlug,
      slug: design.normalSlug,
      name: both ? `${design.name} — Ruled` : design.name,
      series: design.series,
      description: catalogDescription(design),
      price,
      compareAtPrice,
      image: design.image,
      stock: design.specialEdition ? 25 : 50,
      featured: Boolean(design.featured),
      designSlug: design.designSlug,
      size: "normal",
      specialEdition: Boolean(design.specialEdition),
    });

    if (both) {
      push({
        order: order++,
        id: unruledProductSlug(design.normalSlug),
        slug: unruledProductSlug(design.normalSlug),
        name: `${design.name} — Unruled`,
        series: design.series,
        description: `${catalogDescription(design)} Interior option: unruled pages.`,
        price,
        compareAtPrice,
        image: design.image,
        stock: design.specialEdition ? 25 : 50,
        featured: false,
        designSlug: design.designSlug,
        size: "normal",
        specialEdition: Boolean(design.specialEdition),
      });
    }

    if (!design.specialEdition) {
      push({
        order: order++,
        id: design.a4Slug,
        slug: design.a4Slug,
        name: `${design.name} — A4`,
        series: design.series,
        description: catalogDescription(design, true),
        price,
        compareAtPrice,
        image: design.image,
        stock: 0,
        featured: false,
        designSlug: design.designSlug,
        size: "a4",
        specialEdition: false,
      });
    }
  }

  drafts.sort((a, b) => {
    const size = (a.size === "a4" ? 1 : 0) - (b.size === "a4" ? 1 : 0);
    if (size !== 0) return size;
    const featured = Number(b.featured) - Number(a.featured);
    if (featured !== 0) return featured;
    return a.order - b.order;
  });

  return drafts.map(({ order: _order, ...product }) => product);
}

const catalogBySlug = new Map(staticCatalog().map((product) => [product.slug, product]));

export function catalogProduct(slug: string): ProductDTO | undefined {
  return catalogBySlug.get(slug);
}
