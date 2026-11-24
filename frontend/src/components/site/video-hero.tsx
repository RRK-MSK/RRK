"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { HeroBackgroundLayer } from "@/components/site/hero-background-layer";
import {
  defaultHeroCarouselSlides,
  type HeroCarouselSlide,
} from "@/lib/hero-carousel-slides";

import { getEventCtaLabel } from "@/lib/event-booking-mode";
import { getPosterEventStyleClass, isBeerCardAnimation } from "@/lib/event-card-style";
import { PosterBeerFill } from "@/components/site/poster-beer-fill";

import type { PosterEvent } from "./poster-calendar";

const navItems = [
  { href: "#schedule", label: "Афиша" },
  // { href: "#about", label: "Философия" },
  { href: "#founders", label: "Команда" },
];

type VideoHeroProps = {
  nearestEvent?: PosterEvent | null;
  slides?: HeroCarouselSlide[];
};

export function VideoHero({ nearestEvent, slides: slidesProp }: VideoHeroProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const heroBackground = useMemo(() => {
    const source = slidesProp?.length ? slidesProp : defaultHeroCarouselSlides;
    return source.length ? [source[0]] : [];
  }, [slidesProp]);

  return (
    <section className="rrk-video-hero">
      <div className="rrk-video-shell">
        <HeroBackgroundLayer slides={heroBackground} activeIndex={0} reduceMotion />
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
                <p className="rrk-video-eyebrow">саморазвитие через прикол</p>
                <h1>
                  РУССКИЙ РАЗГОВОРНЫЙ
                  <br />
                  КЛУБ
                  <span>.</span>
                </h1>
              </div>
              <p className="rrk-video-description">
              интеллектуально-тусовочное комьюнити Москвы
              <br />
              новые нейронные связи
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
                  <article
                    className={[
                      "poster-event-card",
                      `poster-event-${nearestEvent.tone}`,
                      getPosterEventStyleClass(nearestEvent.cardColor, nearestEvent.cardAnimation),
                      "rrk-hero-event-card",
                    ].filter(Boolean).join(" ")}
                  >
                    {isBeerCardAnimation(nearestEvent.cardAnimation) ? <PosterBeerFill /> : null}
                    <div className="rrk-hero-event-head">
                      <h4>{nearestEvent.title}</h4>
                    </div>
                    <div className="rrk-hero-event-when">
                      <p className="rrk-hero-event-datetime">
                        <strong>{nearestEvent.date}</strong>
                        <span>{nearestEvent.time}</span>
                      </p>
                      {nearestEvent.venueAddress ? (
                        <p className="rrk-hero-event-text">{nearestEvent.venueAddress}</p>
                      ) : null}
                    </div>
                    {nearestEvent.description ? (
                      <p className="rrk-hero-event-text">{nearestEvent.description}</p>
                    ) : null}
                    {nearestEvent.focus ? (
                      <p className="rrk-hero-event-text">{nearestEvent.focus}</p>
                    ) : null}
                    <div className="rrk-hero-event-meta">
                      <p className="rrk-hero-event-price">
                        {nearestEvent.displayPrice ?? nearestEvent.price}
                      </p>
                    </div>
                    <Link
                      href={`/events/${nearestEvent.id}`}
                      className="site-button primary poster-event-register rrk-hero-event-buy"
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
