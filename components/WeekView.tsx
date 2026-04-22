"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TimeSlot } from "@/lib/config";
import { TIME_SLOTS } from "@/lib/types";
import {
  getWeekDays,
  getISOWeek,
  formatWeekRange,
  formatWeekdayShort,
  formatDayOfMonth,
  toDateKey,
  isToday,
  addWeeks,
  subWeeks,
} from "@/lib/date";
import type { Todo } from "@/lib/types";
import type { AppConfig } from "@/lib/config";

type ViewMode = "week" | "month";

interface WeekViewProps {
  anchorDate: Date;
  onAnchorChange: (date: Date) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  config: AppConfig;
  todos: Todo[];
  visibleTypes: Set<string>;
  onCellClick: (date: Date, slot: TimeSlot) => void;
}

export function WeekView({
  anchorDate,
  onAnchorChange,
  viewMode,
  onViewModeChange,
  config,
  todos,
  visibleTypes,
  onCellClick,
}: WeekViewProps) {
  const weekDays = getWeekDays(anchorDate);
  const weekNum = getISOWeek(weekDays[0]);
  const weekLabel = formatWeekRange(weekDays);

  const goToToday = () => onAnchorChange(new Date());
  const goPrev = () => onAnchorChange(subWeeks(anchorDate, 1));
  const goNext = () => onAnchorChange(addWeeks(anchorDate, 1));

  // Filtrer todos til synlige typer og denne ukens datoer
  const visibleTodos = todos.filter((t) => visibleTypes.has(t.type));

  const getTodosForCell = (date: Date, slot: TimeSlot): Todo[] => {
    const key = toDateKey(date);
    return visibleTodos.filter((t) => t.date === key && t.slot === slot);
  };

  const getDayMarker = (date: Date) => {
    const key = toDateKey(date);
    if (config.holidays[key]) return { type: "holiday" as const, label: config.holidays[key] };
    if (config.commercialDays[key])
      return { type: "commercial" as const, label: config.commercialDays[key] };
    return null;
  };

  return (
    <div data-testid="week-view" className="flex-1 flex flex-col min-h-0">
      {/* Kontroll-linje */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            data-testid="week-today-btn"
            onClick={goToToday}
            className="px-3.5 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow transition"
          >
            I dag
          </button>
          <div className="flex rounded-lg overflow-hidden border border-white/20">
            <button
              data-testid="week-prev-btn"
              onClick={goPrev}
              className="p-1.5 text-white hover:bg-white/10 transition"
              aria-label="Forrige uke"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="w-px bg-white/20" />
            <button
              data-testid="week-next-btn"
              onClick={goNext}
              className="p-1.5 text-white hover:bg-white/10 transition"
              aria-label="Neste uke"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 data-testid="week-label" className="text-lg font-semibold text-white">
              {weekLabel}
            </h2>
            <span className="text-xs text-white/60 tabular-nums">Uke {weekNum}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white/5 border border-white/15 rounded-lg p-0.5">
          {(["week", "month"] as ViewMode[]).map((m) => (
            <button
              key={m}
              data-testid={`view-mode-${m}`}
              onClick={() => onViewModeChange(m)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                viewMode === m
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {m === "week" ? "Uke" : "Måned"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4 min-h-0">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl h-full flex flex-col min-h-[520px]">
          {/* Dager-header */}
          <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-white/15 flex-shrink-0">
            <div className="p-2" />
            {weekDays.map((date) => {
              const marker = getDayMarker(date);
              const today = isToday(date);
              return (
                <div
                  key={toDateKey(date)}
                  data-testid={`week-day-header-${toDateKey(date)}`}
                  className="p-2 text-center border-l border-white/10"
                >
                  <div className="text-[10px] font-semibold tracking-wider text-white/60">
                    {formatWeekdayShort(date)}
                  </div>
                  <div
                    className={`mt-1 mx-auto w-8 h-8 flex items-center justify-center text-base font-semibold relative ${
                      today
                        ? "bg-blue-500 rounded-full text-white shadow-lg"
                        : "text-white"
                    }`}
                  >
                    {formatDayOfMonth(date)}
                    {marker && !today && (
                      <span
                        className={`absolute -bottom-0.5 h-1 w-1 rounded-full ${
                          marker.type === "holiday" ? "bg-rose-300" : "bg-amber-300"
                        }`}
                      />
                    )}
                  </div>
                  {marker && (
                    <div
                      className={`text-[9px] mt-1 leading-tight truncate px-0.5 font-medium ${
                        marker.type === "holiday" ? "text-rose-200" : "text-amber-200"
                      }`}
                      title={marker.label}
                    >
                      {marker.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tidslukke-rader */}
          <div className="flex-1 grid grid-cols-[70px_repeat(7,1fr)] grid-rows-4">
            {TIME_SLOTS.map((slot) => (
              <SlotRow
                key={slot}
                slot={slot}
                weekDays={weekDays}
                getTodos={getTodosForCell}
                getDayMarker={getDayMarker}
                config={config}
                onCellClick={onCellClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SlotRowProps {
  slot: TimeSlot;
  weekDays: Date[];
  getTodos: (date: Date, slot: TimeSlot) => Todo[];
  getDayMarker: (date: Date) => { type: "holiday" | "commercial"; label: string } | null;
  config: AppConfig;
  onCellClick: (date: Date, slot: TimeSlot) => void;
}

function SlotRow({
  slot,
  weekDays,
  getTodos,
  getDayMarker,
  config,
  onCellClick,
}: SlotRowProps) {
  return (
    <>
      <div
        data-testid={`slot-label-${slot}`}
        className="px-2 py-1.5 text-[10px] text-white/60 font-semibold tabular-nums border-t border-white/10 flex items-start justify-end pr-3 pt-2"
      >
        {slot}
      </div>
      {weekDays.map((date) => {
        const cellTodos = getTodos(date, slot);
        const marker = getDayMarker(date);
        const today = isToday(date);
        const cellKey = `${toDateKey(date)}_${slot}`;
        return (
          <button
            key={cellKey}
            data-testid={`cell-${cellKey}`}
            onClick={() => onCellClick(date, slot)}
            className={`border-t border-l border-white/10 p-1 text-left transition hover:bg-white/5 group relative min-h-[90px] ${
              marker?.type === "holiday" ? "bg-rose-400/5" : ""
            } ${today ? "bg-blue-400/5" : ""}`}
          >
            <div className="space-y-1">
              {cellTodos.map((t) => {
                const typeConfig = config.taskTypes[t.type];
                if (!typeConfig) return null;
                return (
                  <div
                    key={t.id}
                    data-testid={`todo-card-${t.id}`}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium shadow-sm truncate ${
                      t.completed ? "opacity-50 line-through" : ""
                    }`}
                    style={{ backgroundColor: typeConfig.color, color: "white" }}
                    title={t.title}
                  >
                    {t.title}
                  </div>
                );
              })}
            </div>
            {cellTodos.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-40 transition pointer-events-none">
                <span className="text-white/80 text-lg">+</span>
              </div>
            )}
          </button>
        );
      })}
    </>
  );
}
