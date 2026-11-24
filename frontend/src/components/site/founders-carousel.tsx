"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type FounderCardData = {
  image: string;
  imageClassName?: string;
  name: string;
  role: string;
  preview: string;
  description: string;
};

type FoundersCarouselProps = {
  founders: FounderCardData[];
};

const LOOP_COPIES = 3;

export function FoundersCarousel({ founders }: FoundersCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const blockRef = useRef(false);
  const initializedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  const loopedFounders = useMemo(
    () => Array.from({ length: LOOP_COPIES }, () => founders).flat(),
    [founders],
  );

  const getSetWidth = useCallback(() => {
    const track = trackRef.current;
    if (!track || founders.length === 0) {
      return 0;
    }
    return track.scrollWidth / LOOP_COPIES;
  }, [founders.length]);

  const centerTrack = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      return false;
    }

    const setWidth = getSetWidth();
    if (setWidth < 80) {
      return false;
    }

    track.scrollLeft = setWidth;
    return true;
  }, [getSetWidth]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    let frame = 0;
    let attempts = 0;
    const tryInit = () => {
      if (initializedRef.current) {
        return;
      }

      attempts += 1;
      if (centerTrack() || attempts > 48) {
        initializedRef.current = true;
        setIsReady(true);
        return;
      }

      frame = window.requestAnimationFrame(tryInit);
    };

    frame = window.requestAnimationFrame(tryInit);

    const resizeObserver = new ResizeObserver(() => {
      if (!initializedRef.current) {
        tryInit();
      }
    });

    resizeObserver.observe(track);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [centerTrack, getSetWidth, loopedFounders.length]);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || blockRef.current || !initializedRef.current) {
      return;
    }

    const setWidth = getSetWidth();
    if (setWidth <= 0) {
      return;
    }

    const buffer = 48;
    if (track.scrollLeft <= buffer) {
      blockRef.current = true;
      track.scrollLeft += setWidth;
      window.requestAnimationFrame(() => {
        blockRef.current = false;
      });
      return;
    }

    if (track.scrollLeft >= setWidth * 2 - buffer) {
      blockRef.current = true;
      track.scrollLeft -= setWidth;
      window.requestAnimationFrame(() => {
        blockRef.current = false;
      });
    }
  };

  return (
    <div className={`founders-marquee${isReady ? " is-ready" : ""}`}>
      <div ref={trackRef} className="founders-grid" onScroll={handleScroll}>
        {loopedFounders.map((founder, index) => {
          const copyIndex = Math.floor(index / founders.length);
          const isMiddleCopy = copyIndex === 1;
          const indexInCopy = index % founders.length;

          return (
            <article key={`${founder.name}-${index}`} className="founder-card">
              <div className="founder-image-wrap">
                <Image
                  src={founder.image}
                  alt={founder.name}
                  width={720}
                  height={900}
                  sizes="(max-width: 640px) 82vw, 320px"
                  quality={70}
                  loading={isMiddleCopy && indexInCopy < 2 ? "eager" : "lazy"}
                  priority={isMiddleCopy && indexInCopy === 0}
                  className={`founder-image ${founder.imageClassName ?? ""}`.trim()}
                />
              </div>
              <div className="founder-copy">
                <span>{founder.role}</span>
                <h3>{founder.name}</h3>
                <details className="founder-details" open>
                  <summary style={{ display: "none" }}>{founder.preview}</summary>
                  <p>{founder.description}</p>
                </details>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}