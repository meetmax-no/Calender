"use client";

import { X, Check, Shuffle, Calendar as CalendarIcon, Pin } from "lucide-react";
import type { AppConfig } from "@/lib/config";
import type { BackgroundMode } from "@/hooks/useUserPrefs";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  config: AppConfig;
  backgroundIndex: number;
  backgroundMode: BackgroundMode;
  onSelectBackground: (index: number) => void;
  onSelectMode: (mode: BackgroundMode) => void;
}

export function SettingsPanel({
  open,
  onClose,
  config,
  backgroundIndex,
  backgroundMode,
  onSelectBackground,
  onSelectMode,
}: SettingsPanelProps) {
  if (!open) return null;

  const backgrounds = config.backgrounds ?? [];

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

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white/90">Bakgrunnsbilde</h3>
            <span className="text-[11px] text-white/50">
              {backgrounds.length} tilgjengelige
            </span>
          </div>

          {/* Modus-valg */}
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

          {/* Bilde-galleri */}
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

          {backgroundMode !== "fixed" && (
            <p className="mt-3 text-[11px] text-white/50">
              Modus "{backgroundMode === "daily" ? "Daglig" : "Tilfeldig"}" aktiv — bildevalg
              ignoreres. Bytt til "Fast" for å låse et bilde.
            </p>
          )}
        </section>

        <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-white/40">
          Tips: Rediger listen av bakgrunner i <code className="bg-white/10 px-1 py-0.5 rounded">/public/config.json</code> → <code className="bg-white/10 px-1 py-0.5 rounded">backgrounds</code>.
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
