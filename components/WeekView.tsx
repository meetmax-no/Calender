"use client";

import { ChevronLeft, ChevronRight, Check, Lock } from "lucide-react";
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
import { StatusFilterBar, type StatusFilter } from "./StatusFilterBar";
import { TaskCardTooltip, formatHours } from "./TaskCardTooltip";
import { isBlocked, getDependency } from "@/lib/deps";

type ViewMode = "week" | "month" | "list";

interface WeekViewProps {
  anchorDate: Date;
  onAnchorChange: (date: Date) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  config: AppConfig;
  todos: Todo[];
  visibleTypes: Set<string>;
  statusFilter: StatusFilter;
  onStatusFilterChange: (next: StatusFilter) => void;
  statusCounts: { all: number; open: number; done: number };
  onCellClick: (date: Date, slot: TimeSlot) => void;
  onTodoClick: (todo: Todo) => void;
  onTodoToggle: (id: string) => void;
}

export function WeekView({
  anchorDate,
  onAnchorChange,
  viewMode,
  onViewModeChange,
  config,
  todos,
  visibleTypes,
  statusFilter,
  onStatusFilterChange,
  statusCounts,
  onCellClick,
  onTodoClick,
  onTodoToggle,
}: WeekViewProps) {
  const weekDays = getWeekDays(anchorDate);
  const weekNum = getISOWeek(weekDays[0]);
  const weekLabel = formatWeekRange(weekDays);

  const goToToday = () => onAnchorChange(new Date());
  const goPrev = () => onAnchorChange(subWeeks(anchorDate, 1));
  const goNext = () => onAnchorChange(addWeeks(anchorDate, 1));

  // Filtrer todos til synlige typer + status
  const visibleTodos = todos.filter((t) => {
    if (!visibleTypes.has(t.type)) return false;
    if (statusFilter === "open" && t.completed) return false;
    if (statusFilter === "done" && !t.completed) return false;
    return true;
  });

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

        <div className="flex items-center gap-3">
          <StatusFilterBar
            value={statusFilter}
            onChange={onStatusFilterChange}
            counts={statusCounts}
            testIdPrefix="week-status-filter"
          />

          <div className="flex items-center gap-1 bg-white/5 border border-white/15 rounded-lg p-0.5">
            {(["week", "month", "list"] as ViewMode[]).map((m) => (
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
                {m === "week" ? "Uke" : m === "month" ? "Måned" : "Liste"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4 min-h-0">
        <div className="bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl h-full grid grid-cols-[70px_repeat(7,minmax(0,1fr))] grid-rows-[auto_repeat(4,minmax(105px,1fr))] min-h-[520px]">
          {/* Header rad: tom + 7 dager */}
          <div className="border-b border-white/15" />
          {weekDays.map((date) => {
            const marker = getDayMarker(date);
            const today = isToday(date);
            return (
              <div
                key={`hdr-${toDateKey(date)}`}
                data-testid={`week-day-header-${toDateKey(date)}`}
                className="p-2 text-center border-b border-l border-white/10 min-w-0"
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

          {/* Tidslukke-rader */}
          {TIME_SLOTS.map((slot) => (
            <SlotRow
              key={slot}
              slot={slot}
              weekDays={weekDays}
              getTodos={getTodosForCell}
              allTodos={todos}
              getDayMarker={getDayMarker}
              config={config}
              onCellClick={onCellClick}
              onTodoClick={onTodoClick}
              onTodoToggle={onTodoToggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface SlotRowProps {
  slot: TimeSlot;
  weekDays: Date[];
  getTodos: (date: Date, slot: TimeSlot) => Todo[];
  allTodos: Todo[];
  getDayMarker: (date: Date) => { type: "holiday" | "commercial"; label: string } | null;
  config: AppConfig;
  onCellClick: (date: Date, slot: TimeSlot) => void;
  onTodoClick: (todo: Todo) => void;
  onTodoToggle: (id: string) => void;
}

function SlotRow({
  slot,
  weekDays,
  getTodos,
  allTodos,
  getDayMarker,
  config,
  onCellClick,
  onTodoClick,
  onTodoToggle,
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
          <div
            key={cellKey}
            data-testid={`cell-${cellKey}`}
            className={`border-t border-l border-white/10 p-1.5 transition group relative min-w-0 ${
              marker?.type === "holiday" ? "bg-rose-400/5" : ""
            } ${today ? "bg-blue-400/5" : ""}`}
          >
            {/* Klikkbar bakgrunn for å opprette ny */}
            <button
              data-testid={`cell-bg-${cellKey}`}
              onClick={() => onCellClick(date, slot)}
              className="absolute inset-0 hover:bg-white/5 transition"
              aria-label="Legg til ny oppgave"
            />
            <div className="relative space-y-1 pointer-events-none">
              {cellTodos.map((t) => {
                const typeConfig = config.taskTypes[t.type];
                if (!typeConfig) return null;
                const blocked = !t.completed && isBlocked(t, allTodos);
                const dep = blocked ? getDependency(t, allTodos) : null;
                return (
                  <TaskCardTooltip
                    key={t.id}
                    description={t.description}
                    estimateHours={t.estimateHours}
                    blockedBy={dep?.title}
                  >
                    <div
                      data-testid={`todo-card-${t.id}`}
                      className={`pointer-events-auto flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium shadow-sm group/todo transition ${
                        t.completed ? "opacity-50" : ""
                      }`}
                      style={{ backgroundColor: typeConfig.color, color: "white" }}
                    >
                      <button
                        data-testid={`todo-toggle-${t.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTodoToggle(t.id);
                        }}
                        className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition ${
                          blocked
                            ? "border-white/40 bg-black/30 cursor-not-allowed"
                            : "border-white/60 hover:border-white bg-black/10 hover:bg-black/20"
                        }`}
                        aria-label={
                          blocked
                            ? `Blokkert — venter på ${dep?.title ?? "en annen oppgave"}`
                            : t.completed
                              ? "Marker ikke ferdig"
                              : "Marker ferdig"
                        }
                        title={
                          blocked
                            ? `Blokkert — venter på "${dep?.title ?? "en annen oppgave"}"`
                            : t.completed
                              ? "Marker som ikke-ferdig"
                              : "Marker som ferdig"
                        }
                      >
                        {blocked ? (
                          <Lock className="h-2.5 w-2.5 text-amber-200" strokeWidth={3} />
                        ) : t.completed ? (
                          <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />
                        ) : null}
                      </button>
                      <button
                        data-testid={`todo-click-${t.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTodoClick(t);
                        }}
                        className={`flex-1 min-w-0 truncate text-left leading-tight ${t.completed ? "line-through" : ""}`}
                        title={t.title}
                      >
                        {t.title}
                      </button>
                      {t.estimateHours !== undefined && (
                        <span
                          data-testid={`todo-estimate-${t.id}`}
                          className="flex-shrink-0 text-[10px] font-semibold tabular-nums bg-black/25 px-1.5 py-0.5 rounded-full"
                        >
                          {formatHours(t.estimateHours)}
                        </span>
                      )}
                    </div>
                  </TaskCardTooltip>
                );
              })}
            </div>
            {cellTodos.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-40 transition pointer-events-none">
                <span className="text-white/80 text-lg">+</span>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
