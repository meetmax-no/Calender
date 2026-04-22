"use client";

import { useState } from "react";
import { X, Check, Shuffle, Calendar as CalendarIcon, Pin, Download } from "lucide-react";
import type { AppConfig } from "@/lib/config";
import type { BackgroundMode } from "@/hooks/useUserPrefs";
import type { Todo } from "@/lib/types";
import { getActiveTaskTypes } from "@/hooks/useAppConfig";
import { generateIcs, downloadIcs } from "@/lib/ics";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  config: AppConfig;
  todos: Todo[];
  backgroundIndex: number;
  backgroundMode: BackgroundMode;
  onSelectBackground: (index: number) => void;
  onSelectMode: (mode: BackgroundMode) => void;
}

export function SettingsPanel({
  open,
  onClose,
  config,
  todos,
  backgroundIndex,
  backgroundMode,
  onSelectBackground,
  onSelectMode,
}: SettingsPanelProps) {
  const activeTypes = getActiveTaskTypes(config);
  const [exportTypes, setExportTypes] = useState<Set<string>>(
    new Set(activeTypes.map((t) => t.key)),
  );

  if (!open) return null;

  const backgrounds = config.backgrounds ?? [];

  const toggleExportType = (key: string) => {
    setExportTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const exportCount = todos.filter((t) => exportTypes.has(t.type)).length;

  const handleExport = () => {
    const filtered = todos.filter((t) => exportTypes.has(t.type));
    const ics = generateIcs(filtered, config, "Me & Max ToDo Planner");
    const date = new Date().toISOString().slice(0, 10);
    downloadIcs(ics, `memax-todo-${date}.ics`);
  };

  return (
    <div
      data-testid="settings-backdrop"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        data-testid="settings-panel"
        className="w-full max-w-2xl bg-slate-900/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold tracking-tight">Innstillinger</h2>
          <button
            data-testid="settings-close-btn"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition"
            aria-label="Lukk"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ============== Bakgrunnsbilde ============== */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white/90">Bakgrunnsbilde</h3>
            <span className="text-[11px] text-white/50">
              {backgrounds.length} tilgjengelige
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4" data-testid="settings-mode-picker">
            <ModeOption
              testId="mode-fixed"
              active={backgroundMode === "fixed"}
              onClick={() => onSelectMode("fixed")}
              icon={<Pin className="h-4 w-4" />}
              label="Fast"
              description="Samme bilde hver gang"
            />
            <ModeOption
              testId="mode-daily"
              active={backgroundMode === "daily"}
              onClick={() => onSelectMode("daily")}
              icon={<CalendarIcon className="h-4 w-4" />}
              label="Daglig"
              description="Nytt bilde hver dag"
            />
            <ModeOption
              testId="mode-random"
              active={backgroundMode === "random"}
              onClick={() => onSelectMode("random")}
              icon={<Shuffle className="h-4 w-4" />}
              label="Tilfeldig"
              description="Nytt ved hver sidelast"
            />
          </div>

          <div className="grid grid-cols-3 gap-2" data-testid="settings-gallery">
            {backgrounds.map((bg, idx) => {
              const isActive = idx === backgroundIndex && backgroundMode === "fixed";
              return (
                <button
                  key={idx}
                  data-testid={`settings-bg-${idx}`}
                  onClick={() => {
                    onSelectBackground(idx);
                    onSelectMode("fixed");
                  }}
                  className={`relative group rounded-lg overflow-hidden aspect-video border-2 transition ${
                    isActive
                      ? "border-blue-400 shadow-lg shadow-blue-400/20"
                      : "border-white/10 hover:border-white/40"
                  }`}
                >
                  <img
                    src={bg.url}
                    alt={bg.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-1 left-1.5 right-1.5 text-[10px] font-medium text-white truncate text-left">
                    {bg.name}
                  </div>
                  {isActive && (
                    <div
                      data-testid={`settings-bg-active-${idx}`}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow"
                    >
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ============== Eksport ============== */}
        <section className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white/90">Eksporter til kalender (.ics)</h3>
            <span data-testid="export-count" className="text-[11px] text-white/50 tabular-nums">
              {exportCount} {exportCount === 1 ? "oppgave" : "oppgaver"}
            </span>
          </div>
          <p className="text-[11px] text-white/50 mb-3 leading-relaxed">
            Velg hvilke task-typer som skal eksporteres. Filen kan abonneres på fra
            iPhone Kalender, Google Calendar og andre klienter.
          </p>

          <div
            className="grid grid-cols-2 gap-1.5 mb-4"
            data-testid="export-type-picker"
          >
            {activeTypes.map((t) => {
              const isActive = exportTypes.has(t.key);
              return (
                <button
                  key={t.key}
                  data-testid={`export-type-${t.key}`}
                  onClick={() => toggleExportType(t.key)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition ${
                    isActive
                      ? "border-white/30 bg-white/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center flex-shrink-0 transition ${
                      isActive ? "border-transparent" : "border-white/30 bg-transparent"
                    }`}
                    style={isActive ? { backgroundColor: t.color } : undefined}
                  >
                    {isActive && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </span>
                  <span className="text-xs font-medium text-white truncate flex-1">
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            data-testid="export-download-btn"
            onClick={handleExport}
            disabled={exportCount === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-white/5 disabled:text-white/40 text-white text-sm font-medium shadow transition"
          >
            <Download className="h-4 w-4" />
            Last ned .ics-fil
          </button>
        </section>

        <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-white/40">
          Tips: Rediger task-typer og bakgrunner i{" "}
          <code className="bg-white/10 px-1 py-0.5 rounded">/public/config.json</code>.
        </div>
      </div>
    </div>
  );
}

interface ModeOptionProps {
  testId: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}

function ModeOption({ testId, active, onClick, icon, label, description }: ModeOptionProps) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={`flex flex-col items-start gap-1 p-3 rounded-lg border transition text-left ${
        active
          ? "border-blue-400/60 bg-blue-500/15"
          : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
      }`}
    >
      <div className={`flex items-center gap-1.5 ${active ? "text-blue-200" : "text-white/80"}`}>
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <span className="text-[10px] text-white/50 leading-tight">{description}</span>
    </button>
  );
}
