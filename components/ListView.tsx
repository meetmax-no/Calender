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
} from "lucide-react";
import type { Todo, TimeSlot } from "@/lib/types";
import type { AppConfig } from "@/lib/config";
import { getISOWeek, toDateKey } from "@/lib/date";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

type ViewMode = "week" | "month" | "list";
type StatusFilter = "all" | "open" | "done";
type SortKey = "date" | "type" | "title" | "completed";
type SortDir = "asc" | "desc";

interface ListViewProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  config: AppConfig;
  todos: Todo[];
  visibleTypes: Set<string>;
  onTodoEdit: (todo: Todo) => void;
  onTodoToggle: (id: string) => void;
  onTodoDelete: (id: string) => void;
}

export function ListView({
  viewMode,
  onViewModeChange,
  config,
  todos,
  visibleTypes,
  onTodoEdit,
  onTodoToggle,
  onTodoDelete,
}: ListViewProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
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

  // Tellere for filter-badges
  const counts = useMemo(() => {
    const visible = todos.filter((t) => visibleTypes.has(t.type));
    return {
      all: visible.length,
      open: visible.filter((t) => !t.completed).length,
      done: visible.filter((t) => t.completed).length,
    };
  }, [todos, visibleTypes]);

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

  return (
    <div data-testid="list-view" className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0 gap-3">
        <div className="flex items-center gap-3 flex-1">
          <ListTodo className="h-5 w-5 text-white/70 flex-shrink-0" />
          <h2 data-testid="list-title" className="text-lg font-semibold text-white">
            Alle oppgaver
          </h2>

          {/* Status-filter */}
          <div
            className="flex items-center gap-0.5 bg-white/5 border border-white/15 rounded-lg p-0.5 ml-3"
            data-testid="list-status-filter"
          >
            <FilterPill
              testId="list-filter-all"
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
              label="Alle"
              count={counts.all}
            />
            <FilterPill
              testId="list-filter-open"
              active={statusFilter === "open"}
              onClick={() => setStatusFilter("open")}
              label="Åpne"
              count={counts.open}
              accent="amber"
            />
            <FilterPill
              testId="list-filter-done"
              active={statusFilter === "done"}
              onClick={() => setStatusFilter("done")}
              label="Ferdig"
              count={counts.done}
              accent="emerald"
            />
          </div>
        </div>

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

      {/* Tabell */}
      <div className="flex-1 overflow-auto p-4 min-h-0">
        <div className="max-w-3xl bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {sorted.length === 0 ? (
            <div
              data-testid="list-empty"
              className="p-12 text-center text-white/60 text-sm"
            >
              Ingen oppgaver å vise her.
              {statusFilter !== "all" && (
                <span className="block mt-1 text-white/40 text-xs">
                  Prøv å bytte status-filter.
                </span>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
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
                    className="w-32 text-left"
                  >
                    Dato / Tid
                  </HeaderCell>
                  <th className="px-2 py-2.5 w-14 text-left">Uke</th>
                  <HeaderCell
                    testId="sort-type"
                    active={sortKey === "type"}
                    onClick={() => handleSort("type")}
                    icon={renderSortIcon("type")}
                    className="w-40 text-left"
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
                  <th className="px-3 py-2.5 w-24 text-right">Handlinger</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((t) => {
                  const typeConfig = config.taskTypes[t.type];
                  const week = getISOWeek(new Date(t.date));
                  const dateObj = new Date(t.date);
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
                          onClick={() => onTodoToggle(t.id)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                            t.completed
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-white/30 hover:border-white/60"
                          }`}
                          aria-label={
                            t.completed ? "Marker som åpen" : "Marker som ferdig"
                          }
                          title={t.completed ? "Gjør åpen igjen" : "Marker som ferdig"}
                        >
                          {t.completed && (
                            <Check className="h-3 w-3 text-white" strokeWidth={4} />
                          )}
                        </button>
                      </td>

                      {/* Dato + slot */}
                      <td className="px-3 py-3 text-white">
                        <div className="font-medium tabular-nums">
                          {format(dateObj, "d. MMM", { locale: nb })}
                        </div>
                        <div className="text-[11px] text-white/50 tabular-nums">
                          {format(dateObj, "EEE", { locale: nb })
                            .replace(/\.$/, "")
                            .toLowerCase()}{" "}
                          · {t.slot}
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
                          className={`font-medium ${t.completed ? "line-through text-white/60" : ""}`}
                        >
                          {t.title}
                        </div>
                        {t.description && (
                          <div className="text-[11px] text-white/50 mt-0.5 truncate max-w-md">
                            {t.description}
                          </div>
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

interface FilterPillProps {
  testId: string;
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  accent?: "amber" | "emerald";
}

function FilterPill({ testId, active, onClick, label, count, accent }: FilterPillProps) {
  const activeBg =
    accent === "emerald"
      ? "bg-emerald-500/25 text-emerald-100"
      : accent === "amber"
        ? "bg-amber-500/25 text-amber-100"
        : "bg-white/20 text-white";
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
        active ? activeBg : "text-white/60 hover:text-white hover:bg-white/10"
      }`}
    >
      {label}
      <span
        className={`text-[10px] font-semibold tabular-nums px-1.5 rounded-full ${
          active ? "bg-black/20" : "bg-white/10 text-white/60"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

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
