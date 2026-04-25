"use client";

// Laster kunde-spesifikk config fra /public/clients/<name>.json basert på
// NEXT_PUBLIC_CLIENT_CONFIG. Hvis env mangler eller filen ikke finnes,
// faller vi tilbake til "default" så appen alltid har data.

import { useEffect, useState } from "react";
import { FALLBACK_CONFIG, type AppConfig } from "@/lib/config";

export type ConfigStatus = "loading" | "ready" | "error";

interface UseAppConfigResult {
  config: AppConfig;
  status: ConfigStatus;
  error: string | null;
}

const DEFAULT_CLIENT = "default";

async function fetchClientConfig(name: string): Promise<AppConfig> {
  const res = await fetch(`/clients/${name}.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for clients/${name}.json`);
  return (await res.json()) as AppConfig;
}

export function useAppConfig(): UseAppConfigResult {
  const [config, setConfig] = useState<AppConfig>(FALLBACK_CONFIG);
  const [status, setStatus] = useState<ConfigStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const requested =
        process.env.NEXT_PUBLIC_CLIENT_CONFIG?.trim() || DEFAULT_CLIENT;
      try {
        const data = await fetchClientConfig(requested);
        if (!cancelled) {
          setConfig(data);
          setStatus("ready");
        }
      } catch (primaryErr) {
        // Forsøk fallback til default hvis vi ba om noe annet
        if (requested !== DEFAULT_CLIENT) {
          try {
            const data = await fetchClientConfig(DEFAULT_CLIENT);
            if (!cancelled) {
              setConfig(data);
              setStatus("ready");
              setError(
                `Fant ikke clients/${requested}.json — bruker default i stedet.`,
              );
            }
            return;
          } catch {
            /* fall-through */
          }
        }
        if (!cancelled) {
          setError(
            primaryErr instanceof Error ? primaryErr.message : "Ukjent feil",
          );
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
