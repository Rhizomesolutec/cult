import { notFound } from "next/navigation";
import { NOTEBOOK_DESIGNS } from "@/lib/config/notebook-designs";
import { ProductDetail } from "./ProductDetail";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const design = NOTEBOOK_DESIGNS.find(
    (d) =>
      d.designSlug === slug ||
      d.normalSlug === slug ||
      d.a4Slug === slug,
  );

  if (!design) {
    notFound();
  }

  return (
    <ProductDetail
      design={design}
      initialSize={slug === design.a4Slug ? "a4" : "normal"}
    />
  );
}
