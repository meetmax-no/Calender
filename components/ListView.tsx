"use client";

import { useMemo, useState } from "react";
import {
  Pencil,
  Trash2,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ListTodo,
  Plus,
  Printer,
  Lock,
} from "lucide-react";
import type { Todo } from "@/lib/types";
import type { AppConfig } from "@/lib/config";
import { getISOWeek, toDateKey } from "@/lib/date";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { StatusFilterBar, type StatusFilter } from "./StatusFilterBar";
import { formatHours, VisibilityDot } from "./TaskCardTooltip";
import { getDependency } from "@/lib/deps";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getActiveTaskTypes } from "@/hooks/useAppConfig";

type ViewMode = "week" | "month" | "list";
type SortKey = "date" | "type" | "title" | "completed";
type SortDir = "asc" | "desc";

interface ListViewProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  config: AppConfig;
  todos: Todo[];
  visibleTypes: Set<string>;
  /** Mobil bruker dette for å toggle typer via chip-raden */
  onToggleType?: (typeKey: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (next: StatusFilter) => void;
  statusCounts: { all: number; open: number; done: number };
  onTodoEdit: (todo: Todo) => void;
  onTodoToggle: (id: string) => void;
  onTodoDelete?: (id: string) => void;
  onCreateNew: () => void;
}

export function ListView({
  viewMode,
  onViewModeChange,
  config,
  todos,
  visibleTypes,
  onToggleType,
  statusFilter,
  onStatusFilterChange,
  statusCounts,
  onTodoEdit,
  onTodoToggle,
  onTodoDelete,
  onCreateNew,
}: ListViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Filter: visible types + status
  const filtered = useMemo(() => {
    return todos.filter((t) => {
      if (!visibleTypes.has(t.type)) return false;
      if (statusFilter === "open" && t.completed) return false;
      if (statusFilter === "done" && !t.completed) return false;
      return true;
    });
  }, [todos, visibleTypes, statusFilter]);

  // Sortering
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date":
          cmp = `${a.date}_${a.slot}`.localeCompare(`${b.date}_${b.slot}`);
          break;
        case "type":
          cmp =
            (config.taskTypes[a.type]?.label ?? a.type).localeCompare(
              config.taskTypes[b.type]?.label ?? b.type,
            );
          break;
        case "title":
          cmp = a.title.localeCompare(b.title, "nb");
          break;
        case "completed":
          cmp = Number(a.completed) - Number(b.completed);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir, config]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-3 w-3 text-white/30" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 text-white" />
    ) : (
      <ArrowDown className="h-3 w-3 text-white" />
    );
  };

  const isMobile = useIsMobile();
  const activeTaskTypes = getActiveTaskTypes(config);

  return (
    <div data-testid="list-view" className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10 flex-shrink-0 gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {!isMobile && <ListTodo className="h-5 w-5 text-white/70 flex-shrink-0" />}
          {!isMobile && (
            <h2
              data-testid="list-title"
              className="text-base sm:text-lg font-semibold text-white truncate"
            >
              Alle oppgaver
            </h2>
          )}

          {/* Status-filter */}
          <div className={isMobile ? "" : "ml-3"}>
            <StatusFilterBar
              value={statusFilter}
              onChange={onStatusFilterChange}
              counts={statusCounts}
              testIdPrefix="list-status-filter"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort-dropdown (mobil) */}
          {isMobile && (
            <select
              data-testid="list-sort-mobile"
              value={`${sortKey}-${sortDir}`}
              onChange={(e) => {
                const [key, dir] = e.target.value.split("-") as [SortKey, SortDir];
                setSortKey(key);
                setSortDir(dir);
              }}
              className="bg-white/5 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-400/60"
            >
              <option value="date-asc" className="bg-slate-800">Dato ↑</option>
              <option value="date-desc" className="bg-slate-800">Dato ↓</option>
              <option value="type-asc" className="bg-slate-800">Type</option>
              <option value="completed-asc" className="bg-slate-800">Status</option>
            </select>
          )}

          {/* Desktop-knapper */}
          {!isMobile && (
            <>
              <button
                data-testid="list-create-new-btn"
                onClick={onCreateNew}
                className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium shadow transition flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Ny oppgave
              </button>

              <button
                data-testid="list-print-btn"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition flex items-center gap-1.5 border border-white/15"
                title="Skriv ut listen"
              >
                <Printer className="h-4 w-4" />
                Skriv ut
              </button>

              <div className="flex items-center gap-1 bg-white/5 border border-white/15 rounded-lg p-0.5 print:hidden">
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
            </>
          )}
        </div>
      </div>

      {/* Mobil: chip-rad for typer + kompakt stat */}
      {isMobile && (
        <div className="px-3 pb-2 pt-1 border-b border-white/10 flex flex-col gap-2">
          {/* Stat-rad */}
          <div className="flex items-center justify-between text-[11px] text-white/60 font-medium">
            <span data-testid="mobile-stats">
              <span className="text-white">{statusCounts.open}</span> åpne
              {" · "}
              <span className="text-emerald-300">{statusCounts.done}</span> ferdig
              {" · "}
              <span className="text-white/40">{statusCounts.all}</span> totalt
            </span>
          </div>

          {/* Type-chips */}
          {onToggleType && activeTaskTypes.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-thin">
              {activeTaskTypes.map((typeDef) => {
                const isOn = visibleTypes.has(typeDef.key);
                return (
                  <button
                    key={typeDef.key}
                    data-testid={`mobile-type-chip-${typeDef.key}`}
                    onClick={() => onToggleType(typeDef.key)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition border ${
                      isOn
                        ? "bg-white/15 border-white/25 text-white"
                        : "bg-transparent border-white/10 text-white/40"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: isOn
                          ? typeDef.color
                          : "rgba(255,255,255,0.2)",
                      }}
                    />
                    {typeDef.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tabell / kort-liste */}
      <div className={`flex-1 overflow-auto p-3 sm:p-4 min-h-0 ${isMobile ? "pb-32" : "pb-4"}`}>
        <div className={isMobile ? "" : "bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden"}>
          {sorted.length === 0 ? (
            <div
              data-testid="list-empty"
              className="p-12 text-center text-white/60 text-sm"
            >
              <p>Ingen oppgaver å vise her.</p>
              {statusFilter !== "all" ? (
                <span className="block mt-1 text-white/40 text-xs">
                  Prøv å bytte status-filter.
                </span>
              ) : (
                <button
                  data-testid="list-empty-create-btn"
                  onClick={onCreateNew}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium shadow transition"
                >
                  <Plus className="h-4 w-4" />
                  Opprett din første oppgave
                </button>
              )}
            </div>
          ) : isMobile ? (
            <MobileCardList
              todos={sorted}
              allTodos={todos}
              config={config}
              onTodoEdit={onTodoEdit}
              onTodoToggle={onTodoToggle}
            />
          ) : (
            <table className="w-auto min-w-[720px] text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
                  <th className="px-3 py-2.5 w-10 text-center">
                    <span className="sr-only">Status</span>
                  </th>
                  <HeaderCell
                    testId="sort-date"
                    active={sortKey === "date"}
                    onClick={() => handleSort("date")}
                    icon={renderSortIcon("date")}
                    className="w-28 text-left whitespace-nowrap"
                  >
                    Dato / Tid
                  </HeaderCell>
                  <th className="px-2 py-2.5 w-14 text-left">Uke</th>
                  <HeaderCell
                    testId="sort-type"
                    active={sortKey === "type"}
                    onClick={() => handleSort("type")}
                    icon={renderSortIcon("type")}
                    className="w-40 text-left whitespace-nowrap"
                  >
                    Type
                  </HeaderCell>
                  <HeaderCell
                    testId="sort-title"
                    active={sortKey === "title"}
                    onClick={() => handleSort("title")}
                    icon={renderSortIcon("title")}
                    className="text-left"
                  >
                    Tittel
                  </HeaderCell>
                  <th className="px-2 py-2.5 w-44 text-left text-[10px] font-semibold text-white/60 uppercase tracking-wider whitespace-nowrap">
                    Venter på
                  </th>
                  <th className="px-2 py-2.5 w-16 text-right text-[10px] font-semibold text-white/60 uppercase tracking-wider">
                    Estimat
                  </th>
                  <th className="px-3 py-2.5 w-24 text-right">Handlinger</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((t) => {
                  const typeConfig = config.taskTypes[t.type];
                  const week = getISOWeek(new Date(t.date));
                  const dateObj = new Date(t.date);
                  const dep = getDependency(t, todos);
                  const blocked = !t.completed && Boolean(dep) && !dep!.completed;
                  return (
                    <tr
                      key={t.id}
                      data-testid={`list-row-${t.id}`}
                      className={`border-b border-white/5 hover:bg-white/5 transition ${
                        t.completed ? "opacity-60" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3 text-center">
                        <button
                          data-testid={`list-toggle-${t.id}`}
                          onClick={() => {
                            if (blocked && dep) {
                              onTodoEdit(dep);
                              return;
                            }
                            onTodoToggle(t.id);
                          }}
                          aria-label={
                            blocked
                              ? `Blokkert — klikk for å åpne "${dep?.title}"`
                              : t.completed
                                ? "Marker ikke ferdig"
                                : "Marker ferdig"
                          }
                          title={
                            blocked
                              ? `Blokkert — klikk for å åpne "${dep?.title}"`
                              : undefined
                          }
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                            blocked
                              ? "border-amber-300/50 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer"
                              : t.completed
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-white/30 hover:border-white/60"
                          }`}
                        >
                          {blocked ? (
                            <Lock className="h-3 w-3 text-amber-300" strokeWidth={3} />
                          ) : t.completed ? (
                            <Check className="h-3 w-3 text-white" strokeWidth={4} />
                          ) : null}
                        </button>
                      </td>

                      {/* Dato + slot */}
                      <td className="px-3 py-3 text-white whitespace-nowrap">
                        <div className="font-medium tabular-nums">
                          {format(dateObj, "d. MMM", { locale: nb })}
                        </div>
                        <div className="text-[11px] text-white/50 tabular-nums">
                          {format(dateObj, "EEE", { locale: nb })
                            .replace(/\.$/, "")
                            .toLowerCase()}{" "}
                          · {t.time ? <span className="text-blue-300/90 font-semibold">{t.time}</span> : t.slot}
                        </div>
                      </td>

                      {/* Uke */}
                      <td className="px-2 py-3 text-white/50 text-xs tabular-nums">
                        {week}
                      </td>

                      {/* Type */}
                      <td className="px-3 py-3">
                        {typeConfig ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{
                              backgroundColor: `${typeConfig.color}30`,
                              color: "white",
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: typeConfig.color }}
                            />
                            {typeConfig.label}
                          </span>
                        ) : (
                          <span className="text-white/40 text-xs">{t.type}</span>
                        )}
                      </td>

                      {/* Tittel + beskrivelse */}
                      <td className="px-3 py-3 text-white">
                        <div
                          className={`flex items-center gap-1.5 font-medium ${t.completed ? "line-through text-white/60" : ""}`}
                        >
                          <VisibilityDot visibility={t.visibility} />
                          <span>{t.title}</span>
                        </div>
                        {t.description && (
                          <div className="text-[11px] text-white/50 mt-0.5 truncate max-w-md">
                            {t.description}
                          </div>
                        )}
                      </td>

                      {/* Venter på */}
                      <td className="px-2 py-3 text-[11px]">
                        {dep ? (
                          <button
                            data-testid={`list-dep-${t.id}`}
                            onClick={() => onTodoEdit(dep)}
                            className={`flex items-center gap-1.5 max-w-full text-left transition hover:opacity-100 ${
                              dep.completed ? "text-emerald-300/70" : "text-amber-200"
                            }`}
                            title={`Venter på "${dep.title}" — klikk for å åpne`}
                          >
                            {dep.completed ? (
                              <Check className="h-3 w-3 flex-shrink-0" strokeWidth={3} />
                            ) : (
                              <Lock className="h-3 w-3 flex-shrink-0" />
                            )}
                            <span className="truncate underline decoration-dotted underline-offset-2">
                              {dep.title}
                            </span>
                          </button>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>

                      {/* Estimat */}
                      <td className="px-2 py-3 text-right">
                        {t.estimateHours !== undefined ? (
                          <span
                            data-testid={`list-estimate-${t.id}`}
                            className="text-[11px] font-semibold tabular-nums text-white/70"
                          >
                            {formatHours(t.estimateHours)}
                          </span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>

                      {/* Handlinger */}
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            data-testid={`list-edit-${t.id}`}
                            onClick={() => onTodoEdit(t)}
                            className="p-1.5 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition"
                            aria-label="Rediger"
                            title="Rediger"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {onTodoDelete && (
                            <button
                              data-testid={`list-delete-${t.id}`}
                              onClick={() => {
                                if (window.confirm(`Slett "${t.title}"?`)) {
                                  onTodoDelete(t.id);
                                }
                              }}
                              className="p-1.5 rounded-md hover:bg-red-500/20 text-white/70 hover:text-red-200 transition"
                              aria-label="Slett"
                              title="Slett"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ================== Subcomponents ==================

interface HeaderCellProps {
  testId: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

function HeaderCell({ testId, active, onClick, icon, className, children }: HeaderCellProps) {
  return (
    <th className={`px-3 py-2.5 ${className}`}>
      <button
        data-testid={testId}
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 hover:text-white transition ${
          active ? "text-white" : ""
        }`}
      >
        {children}
        {icon}
      </button>
    </th>
  );
}

// ================== Mobile card list ==================

interface MobileCardListProps {
  todos: Todo[];
  allTodos: Todo[];
  config: AppConfig;
  onTodoEdit: (todo: Todo) => void;
  onTodoToggle: (id: string) => void;
}

function MobileCardList({
  todos,
  allTodos,
  config,
  onTodoEdit,
  onTodoToggle,
}: MobileCardListProps) {
  return (
    <ul data-testid="mobile-card-list" className="flex flex-col gap-2">
      {todos.map((t) => {
        const typeConfig = config.taskTypes[t.type];
        const dateObj = new Date(t.date);
        const dep = getDependency(t, allTodos);
        const blocked = !t.completed && Boolean(dep) && !dep!.completed;
        const dateStr = format(dateObj, "EEE d. MMM", { locale: nb })
          .replace(/\.$/, "")
          .toLowerCase();

        return (
          <li
            key={t.id}
            data-testid={`mobile-card-${t.id}`}
            className={`bg-white/[0.06] backdrop-blur-sm rounded-xl border border-white/10 p-3 flex items-start gap-3 transition ${
              t.completed ? "opacity-60" : ""
            }`}
          >
            {/* Status / blokk-knapp */}
            <button
              data-testid={`mobile-toggle-${t.id}`}
              onClick={(e) => {
                e.stopPropagation();
                if (blocked && dep) {
                  onTodoEdit(dep);
                  return;
                }
                onTodoToggle(t.id);
              }}
              aria-label={
                blocked
                  ? `Blokkert — åpne "${dep?.title}"`
                  : t.completed
                    ? "Marker ikke ferdig"
                    : "Marker ferdig"
              }
              className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                blocked
                  ? "border-amber-300/50 bg-amber-500/10"
                  : t.completed
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-white/30"
              }`}
            >
              {blocked ? (
                <Lock className="h-3.5 w-3.5 text-amber-300" strokeWidth={3} />
              ) : t.completed ? (
                <Check className="h-3.5 w-3.5 text-white" strokeWidth={4} />
              ) : null}
            </button>

            {/* Hovedinnhold — hele blokken er trykkbar for redigering */}
            <button
              data-testid={`mobile-edit-${t.id}`}
              onClick={() => onTodoEdit(t)}
              className="flex-1 min-w-0 text-left"
            >
              {/* Tittel */}
              <div
                className={`flex items-center gap-1.5 text-sm font-medium leading-snug ${
                  t.completed ? "line-through text-white/60" : "text-white"
                }`}
              >
                <VisibilityDot visibility={t.visibility} className="flex-shrink-0" />
                <span>{t.title}</span>
              </div>

              {/* Meta-rad: type-chip + dato/slot + estimat */}
              <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px]">
                {typeConfig && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${typeConfig.color}30`,
                      color: "white",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: typeConfig.color }}
                    />
                    {typeConfig.label}
                  </span>
                )}
                <span className="text-white/60 tabular-nums">
                  {dateStr} · {t.time ? <span className="text-blue-300/90 font-semibold">{t.time}</span> : t.slot}
                </span>
                {t.estimateHours !== undefined && (
                  <span
                    data-testid={`mobile-estimate-${t.id}`}
                    className="text-white/50 tabular-nums"
                  >
                    · {formatHours(t.estimateHours)}
                  </span>
                )}
              </div>

              {/* Venter-på rad */}
              {dep && (
                <div
                  className={`mt-1.5 flex items-center gap-1.5 text-[11px] ${
                    dep.completed ? "text-emerald-300/70" : "text-amber-200"
                  }`}
                >
                  {dep.completed ? (
                    <Check className="h-3 w-3 flex-shrink-0" strokeWidth={3} />
                  ) : (
                    <Lock className="h-3 w-3 flex-shrink-0" />
                  )}
                  <span className="truncate">Venter på: {dep.title}</span>
                </div>
              )}

              {/* Beskrivelse */}
              {t.description && (
                <div className="mt-1 text-[11px] text-white/50 line-clamp-2">
                  {t.description}
                </div>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
