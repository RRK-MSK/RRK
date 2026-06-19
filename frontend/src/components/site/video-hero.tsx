"use client";

import Hls from "hls.js";
import { ArrowLeft, ArrowRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const streamUrl = "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8";

const navItems = [
  { href: "#formats", label: "Форматы" },
  { href: "#merch", label: "Мерч" },
  { href: "#about", label: "О клубе" },
  { href: "#visit", label: "Как прийти" },
  { href: "/crm/login", label: "CRM" },
];

export function VideoHero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    let hls: Hls | null = null;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: false });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
    } else {
      video.src = streamUrl;
    }

    const tryPlay = () => {
      void video.play().catch(() => {});
    };

    video.addEventListener("loadedmetadata", tryPlay);

    return () => {
      video.removeEventListener("loadedmetadata", tryPlay);
      hls?.destroy();
    };
  }, []);

  return (
    <section className="rrk-video-hero">
      <div className="rrk-video-shell">
        <video ref={videoRef} className="rrk-video-media" muted playsInline autoPlay loop />
        <div className="rrk-video-left-gradient" aria-hidden="true" />
        <div className="rrk-video-bottom-gradient" aria-hidden="true" />
        <div className="rrk-video-waves" aria-hidden="true">
          <span className="rrk-video-wave rrk-video-wave-a" />
          <span className="rrk-video-wave rrk-video-wave-b" />
          <span className="rrk-video-wave rrk-video-wave-c" />
        </div>
        <div className="rrk-video-grid" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <header className="rrk-video-header">
          <div className="rrk-video-logo">РРК</div>
          <nav className="rrk-video-nav" aria-label="Основная навигация">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={item.href === "#formats" ? "is-active" : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
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
          <div className="rrk-video-main">
            <div className="rrk-liquid-card">
              <span>[ 2026 ]</span>
              <h3>
                Практики ведут люди из <em>живой</em> среды
              </h3>
              <p>
                Небольшие группы, еженедельные встречи и атмосфера, в которой речь становится
                увереннее, а контакт глубже.
              </p>
            </div>

            <div className="rrk-video-copy">
              <p className="rrk-video-eyebrow">Еженедельная живая практика</p>
              <h1>
                ВХОДИ В СРЕДУ,
                <br />
                ГДЕ ТЕБЯ СЛЫШАТ
                <span>.</span>
              </h1>
              <p className="rrk-video-description">
                РРК собирает единомышленников, синтезирующих искусство, внимание и живой
                контакт. Это встречи, после которых внутри что-то остается.
              </p>
              <div className="rrk-video-actions">
                <Link href="#visit" className="site-button primary rrk-video-cta">
                  Записаться на посещение
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>

          <div className="rrk-video-photo-card">
            <div className="rrk-video-photo-media">
              <Image
                src="/занятие.jpg"
                alt="Встреча Русского Разговорного Клуба"
                width={1200}
                height={900}
                className="rrk-video-photo-image"
                priority
              />
            </div>
            <div className="rrk-video-photo-copy">
              <span>Живая атмосфера</span>
              <p>Круг людей, в котором речь становится свободнее, а контакт сильнее.</p>
            </div>
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div className="rrk-mobile-panel">
          <div className="rrk-mobile-panel-inner">
            <button type="button" className="rrk-mobile-back" onClick={() => setMobileOpen(false)}>
              <ArrowLeft size={18} />
              Назад
            </button>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
