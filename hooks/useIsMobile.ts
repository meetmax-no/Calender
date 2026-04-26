"use client";

import { useEffect, useState } from "react";

/**
 * Returnerer true hvis enheten er en telefon — uavhengig av orientering.
 *
 * Bruker `min(width, height) < 600` slik at iPhone i landscape (typisk 844×390)
 * fortsatt regnes som mobil. iPad i portrait (768×1024) → ikke mobil.
 */
export function useIsMobile(threshold: number = 600): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const minSide = Math.min(window.innerWidth, window.innerHeight);
      setIsMobile(minSide < threshold);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, [threshold]);

  return isMobile;
}
