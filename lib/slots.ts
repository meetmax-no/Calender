// Smart slot-tildeling fra absolutt klokkeslett.
// 08-10  ← 00:00–09:59
// 10-12  ← 10:00–11:59
// 12-14  ← 12:00–13:59
// 14-16  ← 14:00 og senere
//
// Brukes når brukeren skriver inn et klokkeslett i TaskModal — slot velges
// automatisk så hen slipper å huske å oppdatere det.

import type { TimeSlot } from "./config";

/**
 * Returnerer riktig slot for et HH:mm-klokkeslett.
 * Hvis input er ugyldig returneres null.
 */
export function slotForTime(time: string | undefined | null): TimeSlot | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;

  if (h < 10) return "08-10";
  if (h < 12) return "10-12";
  if (h < 14) return "12-14";
  return "14-16";
}

/**
 * Returnerer minutter siden midnatt for et HH:mm-klokkeslett.
 * Brukes for å sortere oppgaver kronologisk innen samme slot.
 * Returnerer Number.POSITIVE_INFINITY hvis tid mangler/er ugyldig
 * (slik at oppgaver UTEN tid sorteres etter dem MED tid).
 */
export function timeToMinutes(time: string | undefined | null): number {
  if (!time) return Number.POSITIVE_INFINITY;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return Number.POSITIVE_INFINITY;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return Number.POSITIVE_INFINITY;
  return h * 60 + m;
}
