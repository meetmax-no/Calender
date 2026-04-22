// Dato-hjelpere for Me & Max ToDo Planner
// Bruker date-fns med norsk locale (Mandag som første ukedag)

import {
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isToday,
  isSameDay,
  startOfMonth,
  endOfMonth,
  getDay,
  format,
} from "date-fns";
import { nb } from "date-fns/locale";

export { addWeeks, subWeeks, isToday, isSameDay };

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
