"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeroProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle: string;
  eyebrow?: string;
  titleId?: string;
  images: { src: string; alt: string }[];
  autoplayMs?: number;
}

export const HeroSection = React.forwardRef<HTMLDivElement, HeroProps>(
  (
    {
      title,
      subtitle,
      eyebrow,
      titleId,
      images,
      autoplayMs = 4000,
      className,
      ...props
    },
    ref,
  ) => {
    const [currentIndex, setCurrentIndex] = React.useState(
      Math.floor(images.length / 2),
    );

    const handleNext = React.useCallback(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, [images.length]);

    const handlePrev = () => {
      setCurrentIndex(
        (prevIndex) => (prevIndex - 1 + images.length) % images.length,
      );
    };

    React.useEffect(() => {
      if (images.length <= 1) return;
      const timer = window.setInterval(handleNext, autoplayMs);
      return () => window.clearInterval(timer);
    }, [autoplayMs, handleNext, images.length]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full flex-col items-center justify-center overflow-x-hidden bg-transparent p-0 text-foreground",
          className,
        )}
        {...props}
      >
        <div className="absolute inset-0 z-0 opacity-30" aria-hidden="true">
          <div className="absolute bottom-0 left-[-20%] top-[-10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(224,32,32,0.22),rgba(255,255,255,0))]" />
          <div className="absolute bottom-0 right-[-20%] top-[-10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(196,30,30,0.16),rgba(255,255,255,0))]" />
        </div>

        <div className="z-10 flex w-full flex-col items-center space-y-8 text-center md:space-y-10">
          <div className="space-y-4">
            {eyebrow ? <p className="cult-eyebrow">{eyebrow}</p> : null}
            <h2 id={titleId} className="cult-display-sm mx-auto max-w-4xl">
              {title}
            </h2>
            <p className="cult-lead mx-auto max-w-2xl">{subtitle}</p>
          </div>

          <div
            className="relative flex h-[350px] w-full max-w-5xl items-center justify-center md:h-[450px]"
            role="region"
            aria-roledescription="carousel"
            aria-labelledby={titleId}
          >
            <div className="relative flex h-full w-full items-center justify-center [perspective:1000px]">
              {images.map((image, index) => {
                const offset = index - currentIndex;
                const total = images.length;
                let pos = (offset + total) % total;
                if (pos > Math.floor(total / 2)) {
                  pos = pos - total;
                }

                const isCenter = pos === 0;
                const isAdjacent = Math.abs(pos) === 1;

                return (
                  <div
                    key={image.src}
                    className={cn(
                      "absolute flex h-96 w-48 items-center justify-center transition-all duration-500 ease-in-out md:h-[450px] md:w-64",
                    )}
                    style={{
                      transform: `
                        translateX(${pos * 45}%)
                        scale(${isCenter ? 1 : isAdjacent ? 0.85 : 0.7})
                        rotateY(${pos * -10}deg)
                      `,
                      zIndex: isCenter ? 10 : isAdjacent ? 5 : 1,
                      opacity: isCenter ? 1 : isAdjacent ? 0.45 : 0,
                      filter: isCenter ? "blur(0px)" : "blur(4px)",
                      visibility: Math.abs(pos) > 1 ? "hidden" : "visible",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="h-full w-full rounded-2xl border border-white/10 object-cover shadow-2xl"
                      draggable={false}
                    />
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border-white/20 bg-background/50 backdrop-blur-sm sm:left-8"
              onClick={handlePrev}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border-white/20 bg-background/50 backdrop-blur-sm sm:right-8"
              onClick={handleNext}
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

HeroSection.displayName = "HeroSection";
