"use client";

import { Loader2, Cloud, CloudOff } from "lucide-react";
import type { SyncStatus } from "@/hooks/useTodos";

interface LoadingToastProps {
  status: SyncStatus;
  configStatus?: "loading" | "ready" | "error";
}

export function LoadingToast({ status, configStatus }: LoadingToastProps) {
  const isLoading = status === "loading" || configStatus === "loading";
  const isSaving = status === "saving";
  const isError = status === "error" || configStatus === "error";
  const visible = isLoading || isSaving || isError;

  if (!visible) return null;

  let title = "Laster...";
  let subtitle = "Henter data fra Upstash";
  let accent = "border-white/20 bg-slate-900/85";
  let Icon = Loader2;
  let iconClass = "animate-spin text-white/80";

  if (isSaving) {
    title = "Lagrer...";
    subtitle = "Skriver til Upstash";
    accent = "border-amber-400/30 bg-slate-900/85";
    iconClass = "animate-spin text-amber-300";
  } else if (isError) {
    title = "Frakoblet";
    subtitle = "Sjekk internett eller API-nøkkel";
    accent = "border-red-400/40 bg-red-950/80";
    Icon = CloudOff;
    iconClass = "text-red-300";
  }

  return (
    <div
      data-testid="loading-toast"
      className={`fixed bottom-6 right-6 z-40 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl text-white min-w-[220px] ${accent} animate-in fade-in slide-in-from-bottom-2 duration-200`}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 ${iconClass}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-[11px] text-white/60">{subtitle}</div>
      </div>
    </div>
  );
}
