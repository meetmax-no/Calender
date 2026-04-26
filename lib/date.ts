// Dato-hjelpere for Me & Max ToDo Planner
// Bruker date-fns med norsk locale (Mandag som første ukedag)

import {
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isToday,
  isSameDay,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
} from "date-fns";
import { nb } from "date-fns/locale";

export { addWeeks, subWeeks, addMonths, subMonths, isToday, isSameDay, isSameMonth };

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

// Mandag-basert uke (nordisk standard)
export function getWeekDays(anchor: Date): Date[] {
  const monday = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function getISOWeek(date: Date): number {
  return parseInt(format(date, "I"), 10);
}

/**
 * Returnerer mandag i gitt ISO-uke i et bestemt år.
 * Hvis year ikke er gitt brukes inneværende år.
 * Returnerer null hvis week er utenfor 1–53.
 */
export function getMondayOfISOWeek(week: number, year?: number): Date | null {
  if (!Number.isFinite(week) || week < 1 || week > 53) return null;
  const targetYear = year ?? new Date().getFullYear();
  // ISO-8601 trick: 4. januar er alltid i ISO-uke 1.
  // Finn mandag i den uka, så legg til (week - 1) uker.
  const jan4 = new Date(targetYear, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // Søndag (0) → 7
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setDate(jan4.getDate() - dayOfWeek + 1);
  const result = new Date(mondayWeek1);
  result.setDate(mondayWeek1.getDate() + (week - 1) * 7);
  return result;
}

export function formatWeekdayShort(date: Date): string {
  return format(date, "EEE", { locale: nb }).replace(/\.$/, "").toUpperCase();
}

export function formatDayOfMonth(date: Date): string {
  return format(date, "d");
}

export function formatWeekRange(weekDays: Date[]): string {
  const first = weekDays[0];
  const last = weekDays[6];
  const firstMonth = format(first, "LLL", { locale: nb });
  const lastMonth = format(last, "LLL", { locale: nb });
  const year = format(last, "yyyy");
  if (firstMonth === lastMonth) {
    return `${format(first, "d")}.–${format(last, "d")}. ${lastMonth} ${year}`;
  }
  return `${format(first, "d. LLL", { locale: nb })} – ${format(last, "d. LLL yyyy", { locale: nb })}`;
}

export function formatMonthTitle(date: Date): string {
  const month = format(date, "LLLL", { locale: nb });
  const capitalized = month.charAt(0).toUpperCase() + month.slice(1);
  return `${capitalized} ${format(date, "yyyy")}`;
}

// Måneds-rutenett til mini-kalender (Man-Søn, null = tomme celler før måneds-start)
export function getMonthCells(anchor: Date): (Date | null)[] {
  const first = startOfMonth(anchor);
  const last = endOfMonth(anchor);
  // Konverter søndag=0..lørdag=6 til mandag=0..søndag=6
  const leadingEmpty = (getDay(first) + 6) % 7;
  const daysInMonth = last.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadingEmpty; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(anchor.getFullYear(), anchor.getMonth(), d));
  }
  return cells;
}

// Fullt måneds-rutenett til Month-view (alltid hele uker, 5-6 rader × 7 dager).
// Inkluderer "spillover"-dager fra forrige/neste måned.
export function getMonthViewGrid(anchor: Date): Date[] {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}
