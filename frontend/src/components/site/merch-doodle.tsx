"use client";

import { useEffect, useState } from "react";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function MerchDoodle() {
  const [progress, setProgress] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const aboutSection = document.getElementById("about");
      const footer = document.querySelector("footer");
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const nextViewportWidth = window.innerWidth || document.documentElement.clientWidth;

      if (!aboutSection || !footer) {
        return;
      }

      const start = aboutSection.offsetTop - viewportHeight * 0.22;
      const end = footer.getBoundingClientRect().top + window.scrollY - viewportHeight * 1.05;
      const rawProgress = end > start ? (window.scrollY - start) / (end - start) : 0;

      setProgress(clamp(rawProgress, 0, 1));
      setViewportWidth(nextViewportWidth);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  const stairCount = 10;
  const stairIndex = Math.floor(progress * stairCount);
  const stairSwing = stairIndex % 2 === 0 ? -14 : 14;
  const doodleWidth = viewportWidth <= 760 ? 32 : 40;
  const horizontalPadding = viewportWidth <= 760 ? 18 : 40;
  const pathWidth = Math.max(viewportWidth - doodleWidth - horizontalPadding * 2, 0);
  const pathWave = Math.sin(progress * Math.PI * 3.2) * Math.min(pathWidth * 0.22, 72);
  const baseX = progress * pathWidth;
  const translateX = `${Math.round(clamp(baseX + pathWave + stairSwing, 0, pathWidth))}px`;
  const translateY = `${Math.round(progress * 420)}px`;
  const rotate = stairSwing > 0 ? 5 : -5;
  const opacity = progress < 0.02 ? 0 : 0.6 + Math.min(progress, 0.4);

  return (
    <div
      className="merch-doodle"
      aria-hidden="true"
      style={{ transform: `translate3d(${translateX}, ${translateY}, 0) rotate(${rotate}deg)`, opacity, width: '120px' }}
    >
      <img src="/человечек.webp" alt="человечек" className="merch-doodle-figure" style={{ width: '100%', height: 'auto', filter: 'brightness(0) invert(1)' }} />
    </div>
  );
}
