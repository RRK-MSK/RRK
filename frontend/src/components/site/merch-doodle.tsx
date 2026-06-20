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
      style={{ transform: `translate3d(${translateX}, ${translateY}, 0) rotate(${rotate}deg)`, opacity }}
    >
      <svg viewBox="0 0 35 106" className="merch-doodle-figure" role="presentation">
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 0.75C22.119 0.75 28.25 6.489 28.25 13.5S22.119 26.25 14.5 26.25 0.75 20.511 0.75 13.5 6.881 0.75 14.5 0.75Z" />
          <path d="M15.5 27 24.5 57" />
          <path d="M15.5 26.8 34 52.5" />
          <path d="M15.5 27.2 5.5 65" />
          <g className="merch-doodle-leg merch-doodle-leg-left">
            <path d="M10.5 103.5 24.5 55.9" />
            <path d="M4 103.5h7" />
          </g>
          <g className="merch-doodle-leg merch-doodle-leg-right">
            <path d="M24.5 56 26.5 82" />
            <path d="M26.5 82 32.5 103.9" />
            <path d="M32.2 103.4 28.2 105.4" />
          </g>
        </g>
        <circle cx="9" cy="9" r="1" fill="currentColor" />
        <circle cx="18" cy="9" r="1" fill="currentColor" />
        <ellipse cx="13.5" cy="15" rx="4.5" ry="1" fill="currentColor" />
      </svg>
    </div>
  );
}
