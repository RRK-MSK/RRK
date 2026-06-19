"use client";

import { useEffect, useState } from "react";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function MerchDoodle() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const section = document.getElementById("merch");

      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const rawProgress = (viewportHeight - rect.top) / (viewportHeight + rect.height * 0.35);

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

  const translateY = `${Math.round(progress * 220)}px`;
  const opacity = 0.42 + progress * 0.58;

  return (
    <div
      className="merch-doodle"
      aria-hidden="true"
      style={{ transform: `translate3d(0, ${translateY}, 0)`, opacity }}
    >
      <svg viewBox="0 0 180 260" className="merch-doodle-figure" role="presentation">
        <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="91" cy="42" r="18" />
          <path d="M83 38c4-4 10-4 15 0" />
          <path d="M87 49h1" />
          <path d="M98 49h1" />
          <path d="M82 60c6 4 12 4 18 0" />
          <path d="M90 60v30" />
          <path d="M90 90c-14 4-23 16-23 34v28h46v-28c0-18-9-30-23-34Z" />
          <path d="M67 124 48 102" />
          <path d="M113 124 129 97" />
          <path d="M79 152v49" />
          <path d="M101 152v49" />
          <path d="M79 201 67 232" />
          <path d="M101 201 115 232" />
          <path d="M67 152h46" />
          <path d="M75 114h30" />
        </g>
      </svg>
      <div className="merch-doodle-copy">
        <span>MERCH</span>
        <p>Человечек в мерче спускается вместе со скроллом.</p>
      </div>
    </div>
  );
}
