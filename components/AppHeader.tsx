"use client";

import { Search, Settings, Menu } from "lucide-react";
import type { SyncStatus } from "@/hooks/useTodos";
import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { getBranding } from "@/lib/branding";
import { useIsMobile } from "@/hooks/useIsMobile";

interface AppHeaderProps {
  status: SyncStatus;
  onSettingsClick: () => void;
}

export function AppHeader({ status, onSettingsClick }: AppHeaderProps) {
  const branding = getBranding();
  const isMobile = useIsMobile();
  const renderStatus = () => {
    if (status === "loading" || status === "saving") {
      return (
        <span
          data-testid={`header-status-${status}`}
          className="flex items-center gap-1.5 text-xs text-amber-200"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          {status === "saving" ? "Lagrer..." : "Laster..."}
        </span>
      );
    }
    if (status === "error") {
      return (
        <span
          data-testid="header-status-error"
          className="flex items-center gap-1.5 text-xs text-red-300"
        >
          <CloudOff className="h-3 w-3" />
          Frakoblet
        </span>
      );
    }
    return (
      <span
        data-testid="header-status-online"
        className="flex items-center gap-1.5 text-xs text-emerald-300"
      >
        <Cloud className="h-3 w-3" />
        Online
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
          {!isMobile && renderStatus()}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <div className={`${isMobile ? "hidden" : "block"} relative`}>
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/70" />
          <input
            data-testid="header-search-input"
            type="text"
            placeholder="Søk i oppgaver..."
            className="w-64 rounded-full bg-white/10 backdrop-blur-sm pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 transition"
          />
        </div>
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
