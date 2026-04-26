"use client";

import { ChevronLeft, ChevronRight, Check, Lock } from "lucide-react";
import type { TimeSlot } from "@/lib/config";
import type { Todo } from "@/lib/types";
import type { AppConfig } from "@/lib/config";
import {
  getMonthViewGrid,
  getISOWeek,
  formatMonthTitle,
  toDateKey,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
} from "@/lib/date";
import { StatusFilterBar, type StatusFilter } from "./StatusFilterBar";
import { TaskCardTooltip, formatHours } from "./TaskCardTooltip";
import { isBlocked, getDependency } from "@/lib/deps";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useIsMobile } from "@/hooks/useIsMobile";

type ViewMode = "week" | "month" | "list";

interface MonthViewProps {
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
  onTodoMove: (id: string, date: string, slot: TimeSlot | undefined) => void;
}

const WEEKDAY_HEADERS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
const MAX_VISIBLE_TASKS = 3;

export function MonthView({
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
  onTodoMove,
}: MonthViewProps) {
  const days = getMonthViewGrid(anchorDate);
  const monthLabel = formatMonthTitle(anchorDate);
  const isMobile = useIsMobile();
  const dnd = useDragAndDrop({ enabled: !isMobile, onMove: onTodoMove });

  const visibleTodos = todos.filter((t) => {
    if (!visibleTypes.has(t.type)) return false;
    if (statusFilter === "open" && t.completed) return false;
    if (statusFilter === "done" && !t.completed) return false;
    return true;
  });
  const todosByDate = new Map<string, Todo[]>();
  for (const t of visibleTodos) {
    const list = todosByDate.get(t.date) ?? [];
    list.push(t);
    todosByDate.set(t.date, list);
  }

  const goToToday = () => onAnchorChange(new Date());
  const goPrev = () => onAnchorChange(subMonths(anchorDate, 1));
  const goNext = () => onAnchorChange(addMonths(anchorDate, 1));

  const getDayMarker = (date: Date) => {
    const key = toDateKey(date);
    if (config.holidays[key]) return { type: "holiday" as const, label: config.holidays[key] };
    if (config.commercialDays[key])
      return { type: "commercial" as const, label: config.commercialDays[key] };
    return null;
  };

  return (
    <div data-testid="month-view" className="flex-1 flex flex-col min-h-0">
      {/* Kontroll-linje (samme stil som WeekView) */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            data-testid="month-today-btn"
            onClick={goToToday}
            className="px-3.5 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow transition"
          >
            I dag
          </button>
          <div className="flex rounded-lg overflow-hidden border border-white/20">
            <button
              data-testid="month-prev-btn"
              onClick={goPrev}
              className="p-1.5 text-white hover:bg-white/10 transition"
              aria-label="Forrige måned"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="w-px bg-white/20" />
            <button
              data-testid="month-next-btn"
              onClick={goNext}
              className="p-1.5 text-white hover:bg-white/10 transition"
              aria-label="Neste måned"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <h2 data-testid="month-label" className="text-lg font-semibold text-white">
            {monthLabel}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <StatusFilterBar
            value={statusFilter}
            onChange={onStatusFilterChange}
            counts={statusCounts}
            testIdPrefix="month-status-filter"
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
        <div className="bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl h-full flex flex-col min-h-[600px]">
          {/* Ukedag-overskrifter */}
          <div className="grid grid-cols-[46px_repeat(7,1fr)] border-b border-white/15 flex-shrink-0">
            <div className="p-2 text-center text-[10px] font-semibold tracking-wider text-white/40">
              UKE
            </div>
            {WEEKDAY_HEADERS.map((d) => (
              <div
                key={d}
                className="p-2 text-center text-[10px] font-semibold tracking-wider text-white/60 border-l border-white/10"
              >
                {d.toUpperCase()}
              </div>
            ))}
          </div>

          {/* Dager - gruppert per uke så vi kan vise ukenr */}
          <div
            className="flex-1 grid grid-cols-[46px_repeat(7,1fr)] auto-rows-fr"
            style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(110px, 1fr))` }}
          >
            {Array.from({ length: days.length / 7 }).map((_, rowIdx) => {
              const rowDays = days.slice(rowIdx * 7, rowIdx * 7 + 7);
              const weekNum = getISOWeek(rowDays[0]);
              return (
                <MonthRow
                  key={`row-${rowIdx}`}
                  rowIdx={rowIdx}
                  rowDays={rowDays}
                  weekNum={weekNum}
                  anchorDate={anchorDate}
                  todosByDate={todosByDate}
                  allTodos={todos}
                  config={config}
                  getDayMarker={getDayMarker}
                  onCellClick={onCellClick}
                  onTodoClick={onTodoClick}
                  onTodoToggle={onTodoToggle}
                  dnd={dnd}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MonthRowProps {
  rowIdx: number;
  rowDays: Date[];
  weekNum: number;
  anchorDate: Date;
  todosByDate: Map<string, Todo[]>;
  allTodos: Todo[];
  config: AppConfig;
  getDayMarker: (date: Date) => { type: "holiday" | "commercial"; label: string } | null;
  onCellClick: (date: Date, slot: TimeSlot) => void;
  onTodoClick: (todo: Todo) => void;
  onTodoToggle: (id: string) => void;
  dnd: ReturnType<typeof useDragAndDrop>;
}

function MonthRow({
  rowIdx,
  rowDays,
  weekNum,
  anchorDate,
  todosByDate,
  allTodos,
  config,
  getDayMarker,
  onCellClick,
  onTodoClick,
  onTodoToggle,
  dnd,
}: MonthRowProps) {
  return (
    <>
      {/* Uke-nummer celle */}
      <div
        data-testid={`month-week-num-${weekNum}`}
        className={`flex items-start justify-center pt-2 text-[11px] font-semibold text-white/50 tabular-nums ${
          rowIdx > 0 ? "border-t border-white/10" : ""
        }`}
        title={`Uke ${weekNum}`}
      >
        {weekNum}
      </div>

      {/* 7 dager */}
      {rowDays.map((date, colIdx) => {
        const key = toDateKey(date);
        const inCurrentMonth = isSameMonth(date, anchorDate);
        const today = isToday(date);
        const dayTodos = todosByDate.get(key) ?? [];
        const marker = getDayMarker(date);
        const isDropTarget = dnd.state.hoverKey === key && dnd.state.activeId !== null;

        return (
          <div
            key={key}
            data-testid={`month-day-${key}`}
            onDragOver={dnd.overCell(key)}
            onDragLeave={dnd.leaveCell(key)}
            onDrop={dnd.dropOnCell(key, undefined)}
            className={`relative flex flex-col p-1.5 transition group border-l border-white/10 ${
              rowIdx > 0 ? "border-t border-white/10" : ""
            } ${!inCurrentMonth ? "bg-black/10" : ""} ${
              marker?.type === "holiday" ? "bg-rose-400/5" : ""
            } ${today ? "bg-blue-400/5" : ""} ${
              isDropTarget ? "ring-2 ring-blue-400/70 ring-inset bg-blue-400/15" : ""
            }`}
          >
            <button
              data-testid={`month-day-bg-${key}`}
              onClick={() => onCellClick(date, "10-12")}
              className="absolute inset-0 hover:bg-white/5 transition"
              aria-label="Legg til ny oppgave"
            />

            <div className="relative flex items-start justify-between pointer-events-none mb-1">
              <div className="flex items-center gap-1.5">
                <div
                  className={`text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                    today
                      ? "bg-blue-500 text-white shadow-md"
                      : inCurrentMonth
                        ? "text-white"
                        : "text-white/30"
                  }`}
                >
                  {date.getDate()}
                </div>
                {marker && inCurrentMonth && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      marker.type === "holiday" ? "bg-rose-300" : "bg-amber-300"
                    }`}
                    title={marker.label}
                  />
                )}
              </div>
            </div>

            {marker && inCurrentMonth && (
              <div
                className={`relative pointer-events-none text-[9px] font-medium leading-tight truncate mb-1 -mt-1 px-0.5 ${
                  marker.type === "holiday" ? "text-rose-200" : "text-amber-200"
                }`}
                title={marker.label}
              >
                {marker.label}
              </div>
            )}

            <div className="relative space-y-0.5 pointer-events-none flex-1 min-h-0">
              {dayTodos.slice(0, MAX_VISIBLE_TASKS).map((t) => {
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
                    onBlockedClick={dep ? () => onTodoClick(dep) : undefined}
                  >
                    <div
                      data-testid={`month-todo-${t.id}`}
                      draggable={!t.completed}
                      onDragStart={dnd.startDrag(t.id)}
                      onDragEnd={dnd.endDrag}
                      className={`pointer-events-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium shadow-sm group/todo transition cursor-grab active:cursor-grabbing ${
                        t.completed ? "opacity-50 cursor-default" : ""
                      } ${!inCurrentMonth ? "opacity-60" : ""} ${
                        dnd.state.activeId === t.id ? "opacity-30 scale-95" : ""
                      }`}
                      style={{ backgroundColor: typeConfig.color, color: "white" }}
                    >
                      <button
                        data-testid={`month-todo-toggle-${t.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (blocked && dep) {
                            onTodoClick(dep);
                            return;
                          }
                          onTodoToggle(t.id);
                        }}
                        className={`flex-shrink-0 w-3 h-3 rounded-full border flex items-center justify-center transition ${
                          blocked
                            ? "border-amber-300/60 hover:border-amber-200 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer"
                            : "border-white/60 hover:border-white bg-black/10 hover:bg-black/20"
                        }`}
                        aria-label={
                          blocked
                            ? `Blokkert — klikk for å åpne "${dep?.title ?? "blokkerende oppgave"}"`
                            : t.completed
                              ? "Marker ikke ferdig"
                              : "Marker ferdig"
                        }
                        title={
                          blocked
                            ? `Blokkert — klikk for å åpne "${dep?.title ?? "blokkerende oppgave"}"`
                            : undefined
                        }
                      >
                        {blocked ? (
                          <Lock className="h-1.5 w-1.5 text-amber-200" strokeWidth={3} />
                        ) : t.completed ? (
                          <Check className="h-1.5 w-1.5 text-white" strokeWidth={4} />
                        ) : null}
                      </button>
                      <button
                        data-testid={`month-todo-click-${t.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTodoClick(t);
                        }}
                        className={`flex-1 min-w-0 truncate text-left leading-tight ${
                          t.completed ? "line-through" : ""
                        }`}
                        title={`${t.title} · ${t.slot}`}
                      >
                        {t.title}
                      </button>
                      {t.estimateHours !== undefined && (
                        <span
                          data-testid={`month-todo-estimate-${t.id}`}
                          className="flex-shrink-0 text-[9px] font-semibold tabular-nums bg-black/25 px-1 rounded"
                        >
                          {formatHours(t.estimateHours)}
                        </span>
                      )}
                    </div>
                  </TaskCardTooltip>
                );
              })}
              {dayTodos.length > MAX_VISIBLE_TASKS && (
                <div
                  data-testid={`month-todo-more-${key}`}
                  className="pointer-events-none text-[10px] text-white/70 font-medium px-1"
                >
                  +{dayTodos.length - MAX_VISIBLE_TASKS} flere
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
