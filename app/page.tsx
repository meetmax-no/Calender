"use client";

import Image from "next/image";
import { Loader2, Cloud, CloudOff, CheckCircle2, Settings } from "lucide-react";
import { useTodos } from "@/hooks/useTodos";
import { useAppConfig, getActiveTaskTypes } from "@/hooks/useAppConfig";

export default function Home() {
  const { todos, status, error } = useTodos();
  const { config, status: configStatus, error: configError } = useAppConfig();

  const activeTypes = getActiveTaskTypes(config);
  const holidaysCount = Object.keys(config.holidays).length;
  const commercialCount = Object.keys(config.commercialDays).length;

  const statusBadge = () => {
    if (status === "loading") {
      return (
        <span data-testid="status-loading" className="flex items-center gap-2 text-xs text-white/80">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Laster...
        </span>
      );
    }
    if (status === "saving") {
      return (
        <span data-testid="status-saving" className="flex items-center gap-2 text-xs text-amber-200">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Lagrer...
        </span>
      );
    }
    if (status === "error") {
      return (
        <span data-testid="status-error" className="flex items-center gap-2 text-xs text-red-300">
          <CloudOff className="h-3.5 w-3.5" /> Frakoblet
        </span>
      );
    }
    return (
      <span data-testid="status-online" className="flex items-center gap-2 text-xs text-emerald-300">
        <Cloud className="h-3.5 w-3.5" /> Online
      </span>
    );
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"
        alt="Fjellandskap"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/20" />

      <main className="relative min-h-screen flex flex-col items-center justify-center px-8 py-12">
        <div
          data-testid="connection-card"
          className="w-full max-w-xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-10 text-white"
        >
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 data-testid="app-title" className="text-3xl font-semibold drop-shadow-lg">
                Me &amp; Max ToDo Planner
              </h1>
              <p className="text-sm text-white/70 mt-1">Grunnmur · Steg 1</p>
            </div>
            {statusBadge()}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-sm text-white/70">JSONBin tilkobling</span>
              <span className="text-xs font-mono text-white/90">todo-max</span>
            </div>

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-sm text-white/70">Antall todos i bin</span>
              <span data-testid="todos-count" className="text-2xl font-semibold tabular-nums">
                {todos.length}
              </span>
            </div>

            {/* Config-status */}
            <div className="border-b border-white/10 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/70 flex items-center gap-2">
                  <Settings className="h-3.5 w-3.5" /> Config
                </span>
                <span data-testid="config-version" className="text-xs font-mono text-white/90">
                  {configStatus === "loading" ? "laster..." : `v${config.version}`}
                </span>
              </div>
              {configStatus === "ready" && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div data-testid="config-tasktypes" className="text-lg font-semibold">
                      {activeTypes.length}
                    </div>
                    <div className="text-white/60">Task-typer</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div data-testid="config-holidays" className="text-lg font-semibold">
                      {holidaysCount}
                    </div>
                    <div className="text-white/60">Helligdager</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div data-testid="config-commercial" className="text-lg font-semibold">
                      {commercialCount}
                    </div>
                    <div className="text-white/60">Merkedager</div>
                  </div>
                </div>
              )}
            </div>

            {/* Vis task-typer med farger */}
            {configStatus === "ready" && activeTypes.length > 0 && (
              <div className="border-b border-white/10 pb-3">
                <div className="text-sm text-white/70 mb-2">Aktive task-typer</div>
                <div className="flex flex-wrap gap-2" data-testid="tasktypes-list">
                  {activeTypes.map((t) => (
                    <div
                      key={t.key}
                      data-testid={`tasktype-chip-${t.key}`}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="font-medium">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Status</span>
              <div>{statusBadge()}</div>
            </div>

            {(status === "error" || configStatus === "error") && (
              <div
                data-testid="error-message"
                className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-400/30 text-sm text-red-100"
              >
                <strong>Feil:</strong> {error || configError}
              </div>
            )}

            {status === "idle" && configStatus === "ready" && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-sm text-emerald-100 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Forbindelse mot JSONBin er OK og config er lastet fra /config.json.
                  Klar for Steg 2 — ukevisning med 7×4 grid.
                </span>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-xs text-white/60 font-mono">v0.1.0 — Foundation</p>
      </main>
    </div>
  );
}
