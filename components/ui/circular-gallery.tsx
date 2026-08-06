"use client";

import Image from "next/image";
import React, { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface GalleryItem {
  common: string;
  binomial: string;
  photo: {
    url: string;
    text: string;
    pos?: string;
    by: string;
  };
}

interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  /** Controls how far the items are from the center. */
  radius?: number;
  /** Controls the speed of auto-rotation when not scrolling. */
  autoRotateSpeed?: number;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius = 600, autoRotateSpeed = 0.02, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rotatorRef = useRef<HTMLDivElement>(null);
    const rotationRef = useRef(0);
    const isScrollingRef = useRef(false);
    const isVisibleRef = useRef(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollRafRef = useRef<number | null>(null);
    const animationRafRef = useRef<number | null>(null);

    const anglePerItem = 360 / items.length;

    const applyRotation = (rotation: number) => {
      const rotator = rotatorRef.current;
      if (!rotator) return;

      rotator.style.transform = `rotateY(${rotation}deg)`;

      const children = rotator.children;
      for (let i = 0; i < children.length; i++) {
        const itemAngle = i * anglePerItem;
        const totalRotation = rotation % 360;
        const relativeAngle = (itemAngle + totalRotation + 360) % 360;
        const normalizedAngle = Math.abs(
          relativeAngle > 180 ? 360 - relativeAngle : relativeAngle,
        );
        const opacity = Math.max(0.3, 1 - normalizedAngle / 180);
        (children[i] as HTMLElement).style.opacity = String(opacity);
      }
    };

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          isVisibleRef.current = entry.isIntersecting;
        },
        { threshold: 0.08, rootMargin: "80px 0px" },
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      const onScroll = () => {
        isScrollingRef.current = true;

        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        const scrollableHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress =
          scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
        rotationRef.current = scrollProgress * 360;

        if (scrollRafRef.current === null) {
          scrollRafRef.current = requestAnimationFrame(() => {
            scrollRafRef.current = null;
            applyRotation(rotationRef.current);
          });
        }

        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
        }, 150);
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      return () => {
        window.removeEventListener("scroll", onScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        if (scrollRafRef.current !== null) {
          cancelAnimationFrame(scrollRafRef.current);
        }
      };
    }, [anglePerItem]);

    useEffect(() => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReducedMotion) {
        applyRotation(rotationRef.current);
        return;
      }

      const tick = () => {
        if (!isScrollingRef.current && isVisibleRef.current) {
          rotationRef.current += autoRotateSpeed;
          applyRotation(rotationRef.current);
        }
        animationRafRef.current = requestAnimationFrame(tick);
      };

      animationRafRef.current = requestAnimationFrame(tick);

      return () => {
        if (animationRafRef.current !== null) {
          cancelAnimationFrame(animationRafRef.current);
        }
      };
    }, [autoRotateSpeed, anglePerItem]);

    const setContainerRef = (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    return (
      <div
        ref={setContainerRef}
        role="region"
        aria-label="Circular 3D Gallery"
        className={cn(
          "relative flex h-full w-full items-center justify-center overflow-visible",
          className,
        )}
        style={{ perspective: "2000px" }}
        {...props}
      >
        <div
          ref={rotatorRef}
          className="relative h-full w-full will-change-transform"
          style={{
            transformStyle: "preserve-3d",
            translate: "0 0",
            rotate: "0deg",
            scale: "1",
          }}
        >
          {items.map((item, i) => {
            const itemAngle = i * anglePerItem;

            return (
              <div
                key={item.photo.url}
                role="group"
                aria-label={item.common}
                className="gallery-item absolute -ml-[95px] -mt-[140px] h-[280px] w-[190px] md:-ml-[128px] md:-mt-[170px] md:h-[340px] md:w-[255px]"
                style={{
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                  left: "50%",
                  top: "50%",
                  opacity: i === 0 ? 1 : 0.3,
                  willChange: "opacity",
                }}
              >
                <div className="group relative h-full w-full overflow-hidden rounded-lg border border-border bg-card/80 shadow-2xl dark:bg-card/50">
                  <Image
                    src={item.photo.url}
                    alt={item.photo.text}
                    fill
                    sizes="(max-width: 768px) 190px, 255px"
                    className="object-cover"
                    style={{ objectPosition: item.photo.pos || "center" }}
                    draggable={false}
                    loading={i < 3 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "auto"}
                  />
                  <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3 text-white md:p-4">
                    <h3 className="text-lg font-bold md:text-xl">{item.common}</h3>
                    <em className="text-xs italic opacity-80 md:text-sm">
                      {item.binomial}
                    </em>
                    <p className="mt-1 text-[10px] opacity-70 md:mt-2 md:text-xs">
                      {item.photo.by}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

CircularGallery.displayName = "CircularGallery";

export { CircularGallery };
