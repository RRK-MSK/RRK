"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const [isTelegram, setIsTelegram] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check if we are inside Telegram Mini App
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).Telegram?.WebApp?.initData) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsTelegram(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).Telegram.WebApp.expand();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).Telegram.WebApp.setHeaderColor("secondary_bg_color");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).Telegram.WebApp.setBackgroundColor("secondary_bg_color");
      }
    }
  }, []);

  if (!isTelegram) return null;

  return (
    <nav className="tma-bottom-nav">
      <Link href="/" className={`tma-nav-item ${pathname === "/" ? "active" : ""}`}>
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
      <Link href="/profile" className={`tma-nav-item ${pathname === "/profile" ? "active" : ""}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>Профиль</span>
      </Link>
    </nav>
  );
}
