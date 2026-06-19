"use client";

import { useEffect, useState } from "react";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function MerchDoodle() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const aboutSection = document.getElementById("about");
      const footer = document.querySelector("footer");
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      if (!aboutSection || !footer) {
        return;
      }

      const start = aboutSection.offsetTop - viewportHeight * 0.22;
      const end = footer.getBoundingClientRect().top + window.scrollY - viewportHeight * 1.05;
      const rawProgress = end > start ? (window.scrollY - start) / (end - start) : 0;
      setProgress(clamp(rawProgress, 0, 1));
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
  const stairSwing = stairIndex % 2 === 0 ? -18 : 18;
  const stairJitter = Math.sin(progress * Math.PI * 16) * 4;
  const translateY = `${Math.round(progress * 420)}px`;
  const translateX = `${Math.round(stairSwing + stairJitter)}px`;
  const rotate = stairSwing > 0 ? 5 : -5;
  const opacity = progress < 0.02 ? 0 : 0.6 + Math.min(progress, 0.4);

  return (
    <div
      className="merch-doodle"
      aria-hidden="true"
      style={{ transform: `translate3d(${translateX}, ${translateY}, 0) rotate(${rotate}deg)`, opacity }}
    >
      <svg viewBox="0 0 180 260" className="merch-doodle-figure" role="presentation">
        <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <g transform="rotate(-24 90 40)">
            <circle cx="90" cy="40" r="16" />
            <path d="M84 36c3-2 9-2 12 0" />
            <path d="M84 45h1" />
            <path d="M95 45h1" />
            <path d="M84 52c3 3 9 3 12 0" />
          </g>
          <path d="M90 56v86" />
          <path d="M89 86c-10 6-18 11-25 18" />
          <path d="M64 104c-4 5-5 11-3 17" />
          <path d="M91 88c11 5 21 10 29 17" />
          <path d="M120 105c4 5 6 9 8 15" />
          <g className="merch-doodle-leg merch-doodle-leg-left">
            <path d="M90 142 82 184" />
            <path d="M82 184 70 214" />
            <path d="M70 214h13" />
          </g>
          <g className="merch-doodle-leg merch-doodle-leg-right">
            <path d="M90 142 99 184" />
            <path d="M99 184 111 214" />
            <path d="M111 214h13" />
          </g>
        </g>
      </svg>
    </div>
  );
}
