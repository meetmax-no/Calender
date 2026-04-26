"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Search, X, Lock } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import type { Todo } from "@/lib/types";
import type { AppConfig } from "@/lib/config";

interface DependencyPickerProps {
  /** ID-en som er valgt (waitingFor) — undefined hvis ingen */
  value: string | undefined;
  /** Liste over kandidater — caller har allerede filtrert ut self/sirkulære/ferdige */
  candidates: Todo[];
  /** Hele listen — brukes til å finne navn/info når value peker til en oppgave */
  allTodos: Todo[];
  /** Config for type-farger og labels */
  config: AppConfig;
  onChange: (id: string | undefined) => void;
}

export function DependencyPicker({
  value,
  candidates,
  allTodos,
  config,
  onChange,
}: DependencyPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => allTodos.find((t) => t.id === value) ?? null,
    [allTodos, value],
  );

  // Lukk ved klikk utenfor
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Sortert + søkt liste
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...candidates].sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot),
    );
    if (!q) return sorted;
    return sorted.filter((t) => {
      const typeLabel = config.taskTypes[t.type]?.label ?? t.type;
      return (
        t.title.toLowerCase().includes(q) ||
        typeLabel.toLowerCase().includes(q) ||
        t.date.includes(q)
      );
    });
  }, [candidates, query, config]);

  return (
    <div ref={wrapperRef} className="relative" data-testid="dep-picker">
      {selected ? (
        <SelectedPill
          todo={selected}
          config={config}
          onClear={() => onChange(undefined)}
          onClick={() => setOpen(!open)}
        />
      ) : (
        <button
          type="button"
          data-testid="dep-picker-open"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Velg oppgave...</span>
        </button>
      )}

      {open && (
        <div
          data-testid="dep-picker-dropdown"
          className="absolute z-50 left-0 right-0 mt-1 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-lg shadow-2xl overflow-hidden"
        >
          <div className="p-2 border-b border-white/10">
            <div className="flex items-center gap-2 bg-white/5 rounded-md px-2 py-1.5">
              <Search className="h-3.5 w-3.5 text-white/40" />
              <input
                data-testid="dep-picker-search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Søk etter tittel, type eller dato..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-white/40 hover:text-white/80 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-white/50">
                Ingen oppgaver matcher.
              </div>
            ) : (
              filtered.map((t) => {
                const typeConfig = config.taskTypes[t.type];
                const dateObj = new Date(t.date + "T12:00:00");
                return (
                  <button
                    type="button"
                    key={t.id}
                    data-testid={`dep-picker-option-${t.id}`}
                    onClick={() => {
                      onChange(t.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="w-full flex items-start gap-2 px-3 py-2 hover:bg-white/10 transition text-left border-b border-white/5 last:border-b-0"
                  >
                    <span
                      className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: typeConfig?.color ?? "#888" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-white/50 mt-0.5 truncate">
                        {typeConfig?.label ?? t.type}{" · "}
                        {format(dateObj, "EEE d. MMM", { locale: nb })
                          .replace(/\.$/, "")}
                        {" · "}
                        {t.slot}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface SelectedPillProps {
  todo: Todo;
  config: AppConfig;
  onClear: () => void;
  onClick: () => void;
}

function SelectedPill({ todo, config, onClear, onClick }: SelectedPillProps) {
  const typeConfig = config.taskTypes[todo.type];
  const dateObj = new Date(todo.date + "T12:00:00");
  return (
    <div
      data-testid="dep-picker-selected"
      className="w-full flex items-center gap-2 bg-white/8 border border-white/20 rounded-lg px-3 py-2 text-sm"
    >
      <Lock className="h-3.5 w-3.5 text-amber-300 flex-shrink-0" />
      <button
        type="button"
        onClick={onClick}
        className="flex-1 min-w-0 flex items-center gap-2 text-left hover:opacity-80 transition"
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: typeConfig?.color ?? "#888" }}
        />
        <span className="text-white font-medium truncate">{todo.title}</span>
        <span className="text-[11px] text-white/50 truncate hidden sm:inline">
          {typeConfig?.label ?? todo.type}{" · "}
          {format(dateObj, "d. MMM", { locale: nb })}{" · "}
          {todo.slot}
        </span>
      </button>
      <button
        type="button"
        data-testid="dep-picker-clear"
        onClick={onClear}
        aria-label="Fjern avhengighet"
        className="text-white/40 hover:text-white transition flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
