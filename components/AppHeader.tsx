"use client";

import { Settings, Menu, Search as SearchIcon, FlaskConical } from "lucide-react";
import type { SyncStatus } from "@/hooks/useTodos";
import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { getBranding } from "@/lib/branding";
import { useIsMobile } from "@/hooks/useIsMobile";
import { SearchInputDesktop } from "./Search";
import type { Todo } from "@/lib/types";
import type { AppConfig } from "@/lib/config";

interface AppHeaderProps {
  status: SyncStatus;
  onSettingsClick: () => void;
  onSearchClickMobile: () => void;
  todos: Todo[];
  config: AppConfig;
  onSelectTodo: (todo: Todo) => void;
  demoMode?: boolean;
  /** Slot for sentralt innhold i headeren (f.eks. WeekStats compact). Kun desktop. */
  centerSlot?: React.ReactNode;
}

export function AppHeader({
  status,
  onSettingsClick,
  onSearchClickMobile,
  todos,
  config,
  onSelectTodo,
  demoMode = false,
  centerSlot,
}: AppHeaderProps) {
  const branding = getBranding();
  const isMobile = useIsMobile();
  const renderStatus = () => {
    const compact = isMobile; // På mobil: kun ikon, ingen tekst
    if (status === "loading" || status === "saving") {
      return (
        <span
          data-testid={`header-status-${status}`}
          className="flex items-center gap-1.5 text-xs text-amber-200"
          title={status === "saving" ? "Lagrer..." : "Laster..."}
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          {!compact && (status === "saving" ? "Lagrer..." : "Laster...")}
        </span>
      );
    }
    if (status === "error") {
      return (
        <span
          data-testid="header-status-error"
          className="flex items-center gap-1.5 text-xs text-red-300"
          title="Frakoblet"
        >
          <CloudOff className="h-3 w-3" />
          {!compact && "Frakoblet"}
        </span>
      );
    }
    return (
      <span
        data-testid="header-status-online"
        className="flex items-center gap-1.5 text-xs text-emerald-300"
        title="Online"
      >
        <Cloud className="h-3 w-3" />
        {!compact && "Online"}
      </span>
    );
  };

  return (
    <header
      data-testid="app-header"
      className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5"
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          data-testid="header-menu-btn"
          className={`${isMobile ? "hidden" : "block"} text-white/80 hover:text-white transition`}
          aria-label="Meny"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-baseline gap-2 min-w-0">
          <h1 className="text-base sm:text-xl font-semibold text-white drop-shadow-lg tracking-tight truncate">
            <span className="text-white/85">{branding.tagline}</span>
            <span className="mx-1.5 sm:mx-2 text-white/50">·</span>
            <span className="font-semibold text-white">{branding.name}</span>
          </h1>
          {demoMode && (
            <span
              data-testid="demo-mode-chip"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-300/40 text-amber-100 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider"
              title="Demo-modus aktiv — sletting er sperret"
            >
              <FlaskConical className="h-3 w-3" />
              Demo
            </span>
          )}
          {renderStatus()}
        </div>
      </div>

      {/* Sentralt slot: brukes til WeekStats compact på desktop */}
      {centerSlot && !isMobile && (
        <div
          data-testid="header-center-slot"
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
        >
          <div className="pointer-events-auto bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-full">
            {centerSlot}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {!isMobile && (
          <SearchInputDesktop todos={todos} config={config} onSelect={onSelectTodo} />
        )}
        {isMobile && (
          <button
            data-testid="header-search-btn-mobile"
            onClick={onSearchClickMobile}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-md transition"
            aria-label="Søk"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
        )}
        <button
          data-testid="header-settings-btn"
          onClick={onSettingsClick}
          className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-md transition"
          aria-label="Innstillinger"
        >
          <Settings className="h-5 w-5" />
        </button>
        <div
          data-testid="header-avatar"
          className={`${isMobile ? "hidden" : "flex"} h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 items-center justify-center text-white text-sm font-semibold shadow-lg`}
        >
          M
        </div>
      </div>
    </header>
  );
}
