// Snooze-logikk for å utsette en oppgave til ny dato.
// Alle datoer er relativt til DAGENS dato (forutsigbart for brukeren).

import { addDays } from "date-fns";
import { toDateKey } from "./date";

export type SnoozeTarget = "tomorrow" | "monday" | "next-week" | "custom";

/**
 * Returnerer ny dato (yyyy-MM-dd) for en gitt snooze-target.
 * For "custom" må kallende kode levere customDate.
 */
export function computeSnoozeDate(
  target: SnoozeTarget,
  customDate?: string,
): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (target) {
    case "tomorrow":
      return toDateKey(addDays(today, 1));

    case "monday": {
      // Neste mandag fra dagens dato. Hvis i dag er mandag → neste uke.
      const dayOfWeek = today.getDay(); // 0=søn, 1=man, ..., 6=lør
      // Beregn dager til neste mandag
      // Man=1 → 7 dager (neste mandag), Tir=2 → 6, Ons=3 → 5, Tor=4 → 4,
      // Fre=5 → 3, Lør=6 → 2, Søn=0 → 1
      const daysUntilMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7;
      return toDateKey(addDays(today, daysUntilMonday));
    }

    case "next-week":
      return toDateKey(addDays(today, 7));

    case "custom":
      if (!customDate) {
        throw new Error("customDate kreves for 'custom' snooze-target");
      }
      return customDate;
  }
}

/**
 * Brukervennlig label for hvert snooze-valg + en preview av faktisk dato.
 * Brukes i meny-komponenten for "I morgen · ons. 30. apr".
 */
export function getSnoozePreview(target: Exclude<SnoozeTarget, "custom">): {
  label: string;
  preview: string;
} {
  const newDate = new Date(computeSnoozeDate(target));
  const preview = newDate.toLocaleDateString("nb-NO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  switch (target) {
    case "tomorrow":
      return { label: "I morgen", preview };
    case "monday":
      return { label: "Mandag", preview };
    case "next-week":
      return { label: "Neste uke", preview };
  }
}
