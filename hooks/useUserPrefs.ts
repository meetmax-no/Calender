"use client";

// Brukerpreferanser lagret i browserens localStorage.
// Hver enhet kan ha forskjellige innstillinger.

import { useCallback, useEffect, useState } from "react";

export type BackgroundMode = "fixed" | "random" | "daily";

export interface UserPrefs {
  backgroundIndex: number; // Indeks i config.backgrounds (brukt når mode=fixed)
  backgroundMode: BackgroundMode;
}

const DEFAULT_PREFS: UserPrefs = {
  backgroundIndex: 0,
  backgroundMode: "fixed",
};

const STORAGE_KEY = "mmtodo.prefs.v1";

export function useUserPrefs() {
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserPrefs>;
        setPrefs({ ...DEFAULT_PREFS, ...parsed });
      }
    } catch {
      // ignorer korrupt data
    }
    setLoaded(true);
  }, []);

  const save = useCallback((next: Partial<UserPrefs>) => {
    setPrefs((prev) => {
      const merged = { ...prev, ...next };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // ignorer
      }
      return merged;
    });
  }, []);

  return { prefs, setPrefs: save, loaded };
}

// Regn ut hvilken bakgrunnsindeks som skal brukes gitt preferanser
export function resolveBackgroundIndex(
  mode: BackgroundMode,
  fixedIndex: number,
  count: number,
): number {
  if (count === 0) return 0;
  if (mode === "random") {
    return Math.floor(Math.random() * count);
  }
  if (mode === "daily") {
    // Deterministisk per dag — samme bilde hele dagen, nytt neste dag
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return dayOfYear % count;
  }
  return Math.min(fixedIndex, count - 1);
}
