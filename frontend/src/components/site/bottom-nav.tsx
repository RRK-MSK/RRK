"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function BottomNav() {
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    // Check if we are inside Telegram Mini App
    if (typeof window !== "undefined" && (window as any).Telegram && (window as any).Telegram.WebApp) {
      // Telegram.WebApp.initData is only present when opened inside Telegram
      if ((window as any).Telegram.WebApp.initData) {
        setIsTelegram(true);
        // Expand the web app to full height
        (window as any).Telegram.WebApp.expand();
        // Optional: set header/bg colors
        (window as any).Telegram.WebApp.setHeaderColor("var(--background)");
        (window as any).Telegram.WebApp.setBackgroundColor("var(--background)");
      }
    }
  }, []);

  if (!isTelegram) return null;

  return (
    <nav className="tma-bottom-nav">
      <Link href="/" className="tma-nav-item">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>Афиша</span>
      </Link>
      <Link href="/#about" className="tma-nav-item">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>О клубе</span>
      </Link>
    </nav>
  );
}
