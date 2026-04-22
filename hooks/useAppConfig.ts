"use client";

// Laster /config.json ved runtime. Filen ligger i /public så den serves
// direkte av Vercel CDN. Brukeren kan redigere den via kodo-editor og
// commite til GitHub — appen plukker opp endringen ved neste sidelast.

import { useEffect, useState } from "react";
import { FALLBACK_CONFIG, type AppConfig } from "@/lib/config";

export type ConfigStatus = "loading" | "ready" | "error";

interface UseAppConfigResult {
  config: AppConfig;
  status: ConfigStatus;
  error: string | null;
}

export function useAppConfig(): UseAppConfigResult {
  const [config, setConfig] = useState<AppConfig>(FALLBACK_CONFIG);
  const [status, setStatus] = useState<ConfigStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/config.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as AppConfig;
        if (!cancelled) {
          setConfig(data);
          setStatus("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Ukjent feil");
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { config, status, error };
}

// Hjelpefunksjoner for å hente enkelt-informasjon fra config
export function getActiveTaskTypes(config: AppConfig) {
  return Object.entries(config.taskTypes)
    .filter(([, t]) => t.active)
    .map(([key, value]) => ({ key, ...value }));
}

export function getDayMarker(
  config: AppConfig,
  dateStr: string,
): { type: "holiday" | "commercial"; label: string } | null {
  if (config.holidays[dateStr]) {
    return { type: "holiday", label: config.holidays[dateStr] };
  }
  if (config.commercialDays[dateStr]) {
    return { type: "commercial", label: config.commercialDays[dateStr] };
  }
  return null;
}
