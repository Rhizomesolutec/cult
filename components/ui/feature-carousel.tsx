"use client";

import React from "react";
import { CircularGallery, type GalleryItem } from "@/components/ui/circular-gallery";
import { cn } from "@/lib/utils";

interface HeroProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle: string;
  eyebrow?: string;
  titleId?: string;
  items: GalleryItem[];
  /** Distance of cards from the gallery center (px). */
  radius?: number;
  /** Auto-rotation speed when the page is not scrolling. */
  autoRotateSpeed?: number;
}

export const HeroSection = React.forwardRef<HTMLDivElement, HeroProps>(
  (
    {
      title,
      subtitle,
      eyebrow,
      titleId,
      items,
      radius = 360,
      autoRotateSpeed = 0.015,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full flex-col items-center justify-center overflow-visible bg-transparent p-0 text-foreground",
          className,
        )}
        {...props}
      >
        <div className="absolute inset-0 z-0 overflow-hidden opacity-30" aria-hidden="true">
          <div className="absolute bottom-0 left-[-20%] top-[-10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(224,32,32,0.22),rgba(255,255,255,0))]" />
          <div className="absolute bottom-0 right-[-20%] top-[-10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(196,30,30,0.16),rgba(255,255,255,0))]" />
        </div>

        <div className="z-10 flex w-full flex-col items-center space-y-6 text-center md:space-y-8">
          <div className="space-y-3">
            {eyebrow ? <p className="cult-eyebrow">{eyebrow}</p> : null}
            <h2 id={titleId} className="cult-display-sm mx-auto max-w-4xl">
              {title}
            </h2>
            <p className="cult-lead mx-auto max-w-2xl">{subtitle}</p>
          </div>

          <div
            className="relative flex h-[min(420px,72vw)] w-full max-w-4xl items-center justify-center overflow-visible md:h-[460px]"
            aria-labelledby={titleId}
          >
            <CircularGallery
              items={[...items]}
              radius={radius}
              autoRotateSpeed={autoRotateSpeed}
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    );
  },
);

HeroSection.displayName = "HeroSection";
