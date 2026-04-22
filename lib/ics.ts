// .ics (iCalendar) generator for Me & Max ToDo Planner

import type { Todo } from "./types";
import type { AppConfig, TimeSlot } from "./config";

const SLOT_TIMES: Record<TimeSlot, { start: string; end: string }> = {
  "08-10": { start: "080000", end: "100000" },
  "10-12": { start: "100000", end: "120000" },
  "12-14": { start: "120000", end: "140000" },
  "14-16": { start: "140000", end: "160000" },
};

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function formatDateIcs(dateStr: string): string {
  // YYYY-MM-DD -> YYYYMMDD
  return dateStr.replace(/-/g, "");
}

export function generateIcs(
  todos: Todo[],
  config: AppConfig,
  calendarName: string = "Me & Max ToDo Planner",
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MeMax//ToDoPlanner//NO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
    "X-WR-TIMEZONE:Europe/Oslo",
  ];

  const dtstamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  for (const t of todos) {
    const times = SLOT_TIMES[t.slot];
    if (!times) continue;
    const day = formatDateIcs(t.date);
    const typeLabel = config.taskTypes[t.type]?.label ?? t.type;
    const summaryParts = [typeLabel, t.title];
    if (t.completed) summaryParts.unshift("✓");
    const summary = summaryParts.join(" · ");

    const description = [
      `Type: ${typeLabel}`,
      `Status: ${t.completed ? "Ferdig" : "Åpen"}`,
      t.description ? `Notat: ${t.description}` : null,
    ]
      .filter(Boolean)
      .join("\\n");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${t.id}@memax-todo`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=Europe/Oslo:${day}T${times.start}`,
      `DTEND;TZID=Europe/Oslo:${day}T${times.end}`,
      `SUMMARY:${escapeIcs(summary)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      `CATEGORIES:${escapeIcs(typeLabel)}`,
      `STATUS:${t.completed ? "COMPLETED" : "CONFIRMED"}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
