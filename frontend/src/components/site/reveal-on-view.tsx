"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type RevealOnViewProps = {
  children: ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
};

export function RevealOnView({
  children,
  className,
  threshold = 0.2,
  rootMargin = "0px 0px -8% 0px",
}: RevealOnViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const updateVisibility = () => {
      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
      const visibleRatio = Math.max(0, visibleHeight) / Math.max(rect.height, 1);
      setIsVisible(visibleRatio >= threshold);
      setIsReady(true);
    };

    updateVisibility();

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting && entry.intersectionRatio >= threshold);
      },
      {
        threshold: [0, threshold, 1],
        rootMargin,
      },
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  return (
    <div
      ref={containerRef}
      className={className}
      data-reveal-ready={isReady ? "true" : "false"}
      data-reveal-visible={isVisible ? "true" : "false"}
    >
      {children}
    </div>
  );
}
