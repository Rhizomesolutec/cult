import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contact — CultScribe",
  description:
    "Reach CultScribe for orders, stockists, or collaboration. Where legends live forever.",
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
