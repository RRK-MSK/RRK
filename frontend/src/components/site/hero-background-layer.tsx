"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import type { HeroCarouselSlide } from "@/lib/hero-carousel-slides";

type HeroBackgroundLayerProps = {
  slides: HeroCarouselSlide[];
  activeIndex: number;
  reduceMotion?: boolean;
};

function SlideBackgroundMedia({
  slide,
  isActive,
}: {
  slide: HeroCarouselSlide;
  isActive: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || slide.type !== "video") {
      return;
    }

    if (isActive) {
      void video.play().catch(() => {});
      return;
    }

    video.pause();
    video.currentTime = 0;
  }, [isActive, slide.type, slide.src]);

  if (slide.type === "video") {
    return (
      <video
        ref={videoRef}
        className="rrk-hero-bg-media"
        src={slide.src}
        poster={slide.poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
    );
  }

  return (
    <Image
      className="rrk-hero-bg-media"
      src={slide.src}
      alt=""
      fill
      sizes="100vw"
      quality={65}
      priority={isActive}
    />
  );
}

export function HeroBackgroundLayer({
  slides,
  activeIndex,
  reduceMotion = false,
}: HeroBackgroundLayerProps) {
  if (!slides.length) {
    return <div className="rrk-hero-bg-fallback" aria-hidden="true" />;
  }

  const safeIndex = ((activeIndex % slides.length) + slides.length) % slides.length;

  return (
    <div className="rrk-hero-bg-stack" aria-hidden="true">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={[
            "rrk-hero-bg-layer",
            index === safeIndex ? "is-active" : "",
            reduceMotion ? "is-static" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <SlideBackgroundMedia slide={slide} isActive={index === safeIndex} />
        </div>
      ))}
    </div>
  );
}
