"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

export function ScrollReset() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const { history, location } = window;
    const scrollToTop = () => {
      if (location.hash) {
        return;
      }

      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    history.scrollRestoration = "manual";
    scrollToTop();

    const rafId = window.requestAnimationFrame(scrollToTop);
    const timeoutId = window.setTimeout(scrollToTop, 80);
    const handlePageShow = () => scrollToTop();

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [pathname]);

  return null;
}
