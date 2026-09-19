"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { HeroBackgroundLayer } from "@/components/site/hero-background-layer";
import {
  defaultHeroCarouselSlides,
  type HeroCarouselSlide,
} from "@/lib/hero-carousel-slides";

import { getEventCtaLabel } from "@/lib/event-booking-mode";

import type { PosterEvent } from "./poster-calendar";

const AUTOPLAY_MS = 10_000;

const navItems = [
  { href: "#schedule", label: "Афиша" },
  { href: "#about", label: "О клубе" },
  { href: "#founders", label: "Основатели" },
];

type VideoHeroProps = {
  nearestEvent?: PosterEvent | null;
  slides?: HeroCarouselSlide[];
};

function modIndex(value: number, length: number) {
  return ((value % length) + length) % length;
}

export function VideoHero({ nearestEvent, slides: slidesProp }: VideoHeroProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const slides = useMemo(
    () => (slidesProp?.length ? slidesProp : defaultHeroCarouselSlides),
    [slidesProp],
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveSlideIndex((current) => modIndex(current + 1, slides.length));
    }, AUTOPLAY_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [slides.length]);

  return (
    <section className="rrk-video-hero">
      <div className="rrk-video-shell">
        <HeroBackgroundLayer
          slides={slides}
          activeIndex={activeSlideIndex}
          reduceMotion={reduceMotion}
        />
        <div className="rrk-video-left-gradient" aria-hidden="true" />
        <div className="rrk-video-bottom-gradient" aria-hidden="true" />

        <header className="rrk-video-header">
          <button
            type="button"
            className="rrk-video-menu"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <div className="rrk-video-content">
          <div className="rrk-video-hero-row">
            <div className="rrk-video-copy">
              <div className="rrk-video-copy-title">
                <p className="rrk-video-eyebrow">Речь реакция культура</p>
                <h1>
                  РУССКИЙ РАЗГОВОРНЫЙ
                  <br />
                  КЛУБ
                  <span>.</span>
                </h1>
              </div>
              <p className="rrk-video-description">
                Место, где ты раскрепощаешься, учишься быстро реагировать, находишь сильное
                окружение и весело проводишь время.
              </p>
              {!nearestEvent?.id ? (
                <div className="rrk-video-actions">
                  <Link href="#schedule" className="site-button primary rrk-video-cta">
                    Купить
                  </Link>
                </div>
              ) : null}
            </div>

            {nearestEvent?.id ? (
              <aside className="rrk-hero-event-side">
                <div className="rrk-hero-event-feature">
                  <span className="rrk-hero-event-kicker">Ближайшее событие</span>
                  <article className={`poster-event-card poster-event-${nearestEvent.tone} rrk-hero-event-card`}>
                    <div className="rrk-hero-event-head">
                      <h4>{nearestEvent.title}</h4>
                    </div>
                    {nearestEvent.description ? (
                      <p className="rrk-hero-event-text">{nearestEvent.description}</p>
                    ) : null}
                    {nearestEvent.focus ? (
                      <p className="rrk-hero-event-text">{nearestEvent.focus}</p>
                    ) : null}
                    <div className="rrk-hero-event-meta">
                      <p className="rrk-hero-event-datetime">
                        <strong>{nearestEvent.date}</strong>
                        <span>{nearestEvent.time}</span>
                      </p>
                      <p className="rrk-hero-event-price">
                        {nearestEvent.displayPrice ?? nearestEvent.price}
                      </p>
                    </div>
                    <Link
                      href={`/events/${nearestEvent.id}`}
                      className="site-button primary rrk-hero-event-buy"
                    >
                      {getEventCtaLabel(nearestEvent.bookingMode)}
                    </Link>
                  </article>
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div className="rrk-mobile-panel">
          <div className="rrk-mobile-panel-inner">
            <div className="rrk-mobile-panel-top">
              <span>Русский разговорный клуб</span>
              <button type="button" className="rrk-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Закрыть меню">
                <X size={20} />
              </button>
            </div>
            <div className="rrk-mobile-links">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="rrk-mobile-panel-footer">
              <a href="mailto:test@rrk.club">test@rrk.club</a>
              <img src="/ррк.webp" alt="РРК" style={{ height: '32px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
