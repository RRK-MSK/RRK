"use client";

import Hls from "hls.js";
import { ArrowRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const streamUrl = "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8";

const navItems = [
  { href: "#formats", label: "Форматы" },
  { href: "#about", label: "О клубе" },
  { href: "#visit", label: "Как прийти" },
  { href: "#founders", label: "Основатели" },
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
      <nav className="rrk-video-nav" aria-label="Основная навигация">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={item.href === "#formats" ? "is-active" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

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
          <div className="rrk-video-logo" style={{ visibility: 'hidden' }}>РРК</div>
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

        <div className="rrk-video-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', paddingBottom: '40px' }}>
          <div className="rrk-video-main" style={{ maxWidth: '50%' }}>
            <div className="rrk-video-copy">
              <p className="rrk-video-eyebrow">Речь реакция культура</p>
              <h1>
                РУССКИЙ РАЗГОВОРНЫЙ
                <br />
                КЛУБ
                <span>.</span>
              </h1>
              <p className="rrk-video-description">
                Место, где ты раскрепощаешься, учишься быстро реагировать, находишь сильное
                окружение и весело проводишь время.
              </p>
              <div className="rrk-video-actions">
                <Link href="#visit" className="site-button primary rrk-video-cta">
                  Записаться
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>

          <div style={{ alignSelf: 'center', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <img src="/ррк.webp" alt="РРК" style={{ height: '180px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
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
