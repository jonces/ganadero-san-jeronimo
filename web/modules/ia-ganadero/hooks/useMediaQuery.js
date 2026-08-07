"use client";
import { useState, useEffect } from "react";

/**
 * Detecta si una media query está activa.
 * @param {string} query — p.ej. "(max-width: 768px)"
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** Atajos de breakpoints del módulo IA */
export function useBreakpoints() {
  const isMobile  = useMediaQuery("(max-width: 768px)");
  const isTablet  = useMediaQuery("(min-width: 769px) and (max-width: 1024px)");
  const isDesktop = !isMobile && !isTablet;
  return { isMobile, isTablet, isDesktop };
}

/** Detecta si el sistema está en dark mode */
export function usePrefersDark() {
  return useMediaQuery("(prefers-color-scheme: dark)");
}
