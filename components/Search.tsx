"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Check } from "lucide-react";
import type { Todo } from "@/lib/types";
import type { AppConfig } from "@/lib/config";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface SearchResultsProps {
  query: string;
  todos: Todo[];
  config: AppConfig;
  onSelect: (todo: Todo) => void;
  onClose: () => void;
  variant: "dropdown" | "fullscreen";
}

const MAX_RESULTS = 8;

function rank(todo: Todo, q: string): number {
  const titleIdx = todo.title.toLowerCase().indexOf(q);
  if (titleIdx === 0) return 0;
  if (titleIdx > 0) return 1;
  if (todo.description?.toLowerCase().includes(q)) return 2;
  return 99;
}

function highlight(text: string, q: string): React.ReactNode {
  if (!q) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-300/30 text-white rounded-sm px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export function SearchResults({
  query,
  todos,
  config,
  onSelect,
  onClose,
  variant,
}: SearchResultsProps) {
  const q = query.trim().toLowerCase();
  const [activeIdx, setActiveIdx] = useState(0);

  const results = useMemo(() => {
    if (!q) return [] as Todo[];
    const matches = todos
      .filter((t) => {
        const inTitle = t.title.toLowerCase().includes(q);
        const inDesc = t.description?.toLowerCase().includes(q) ?? false;
        return inTitle || inDesc;
      })
      .map((t) => ({ todo: t, score: rank(t, q) }))
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        // Nyeste først
        return `${b.todo.date}_${b.todo.slot}`.localeCompare(`${a.todo.date}_${a.todo.slot}`);
      })
      .map((r) => r.todo);
    return matches;
  }, [q, todos]);

  const visible = variant === "fullscreen" ? results : results.slice(0, MAX_RESULTS);

  useEffect(() => {
    setActiveIdx(0);
  }, [q]);

  // Tastatur-navigasjon
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (visible.length === 0) {
        if (e.key === "Escape") onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % visible.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + visible.length) % visible.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        onSelect(visible[activeIdx]);
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, activeIdx, onSelect, onClose]);

  if (!q) return null;

  const wrapper =
    variant === "dropdown"
      ? "absolute top-full mt-2 left-0 right-0 z-30 max-h-96 overflow-auto rounded-xl bg-slate-900/95 backdrop-blur-xl border border-white/15 shadow-2xl"
      : "flex-1 overflow-auto";

  return (
    <div data-testid="search-results" className={wrapper}>
      {visible.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-white/60">
          Ingen treff for «{query}»
        </div>
      ) : (
        <ul className="py-1">
          {visible.map((t, i) => {
            const typeConfig = config.taskTypes[t.type];
            const dateObj = new Date(t.date);
            const dateStr = format(dateObj, "EEE d. MMM", { locale: nb })
              .replace(/\.$/, "")
              .toLowerCase();
            return (
              <li key={t.id}>
                <button
                  data-testid={`search-result-${t.id}`}
                  onClick={() => onSelect(t)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 transition ${
                    activeIdx === i ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  {typeConfig && (
                    <span
                      className="flex-shrink-0 w-2 h-2 rounded-full"
                      style={{ backgroundColor: typeConfig.color }}
                      title={typeConfig.label}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium truncate ${
                        t.completed ? "line-through text-white/50" : "text-white"
                      }`}
                    >
                      {highlight(t.title, q)}
                    </div>
                    <div className="text-[11px] text-white/50 mt-0.5 flex items-center gap-2 truncate">
                      <span className="tabular-nums">
                        {dateStr} · {t.slot}
                      </span>
                      {typeConfig && (
                        <>
                          <span className="text-white/30">·</span>
                          <span className="truncate">{typeConfig.label}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {t.completed && (
                    <Check
                      className="h-4 w-4 text-emerald-400 flex-shrink-0"
                      strokeWidth={3}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {variant === "dropdown" && results.length > MAX_RESULTS && (
        <div className="px-3 py-2 text-[11px] text-white/40 text-center border-t border-white/10">
          Viser {MAX_RESULTS} av {results.length} treff. Skriv mer for å filtrere.
        </div>
      )}
    </div>
  );
}

// =================== Desktop: dropdown i header ===================

interface SearchInputDesktopProps {
  todos: Todo[];
  config: AppConfig;
  onSelect: (todo: Todo) => void;
}

export function SearchInputDesktop({ todos, config, onSelect }: SearchInputDesktopProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Lukk på utenfor-klikk
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/70 pointer-events-none" />
      <input
        data-testid="header-search-input"
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => query && setOpen(true)}
        placeholder="Søk i oppgaver..."
        className="w-64 rounded-full bg-white/10 backdrop-blur-sm pl-9 pr-8 py-2 text-sm text-white placeholder:text-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 transition"
      />
      {query && (
        <button
          data-testid="search-clear-btn"
          onClick={() => {
            setQuery("");
            setOpen(false);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
          aria-label="Tøm søk"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      {open && (
        <SearchResults
          query={query}
          todos={todos}
          config={config}
          variant="dropdown"
          onSelect={(t) => {
            onSelect(t);
            setQuery("");
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// =================== Mobil: full-screen overlay ===================

interface SearchOverlayMobileProps {
  open: boolean;
  onClose: () => void;
  todos: Todo[];
  config: AppConfig;
  onSelect: (todo: Todo) => void;
}

export function SearchOverlayMobile({
  open,
  onClose,
  todos,
  config,
  onSelect,
}: SearchOverlayMobileProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      data-testid="search-overlay-mobile"
      className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col"
    >
      <div className="flex items-center gap-2 p-3 border-b border-white/10">
        <button
          data-testid="search-overlay-close"
          onClick={onClose}
          className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition"
          aria-label="Lukk søk"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70 pointer-events-none" />
          <input
            ref={inputRef}
            data-testid="search-overlay-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søk i oppgaver..."
            className="w-full rounded-full bg-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
          />
        </div>
      </div>

      {query.trim() ? (
        <SearchResults
          query={query}
          todos={todos}
          config={config}
          variant="fullscreen"
          onSelect={(t) => {
            onSelect(t);
            onClose();
          }}
          onClose={onClose}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-white/40">
          Begynn å skrive for å søke...
        </div>
      )}
    </div>
  );
}
