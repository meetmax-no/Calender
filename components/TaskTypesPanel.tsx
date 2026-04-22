"use client";

import { Plus, Check } from "lucide-react";
import type { AppConfig } from "@/lib/config";
import { getActiveTaskTypes } from "@/hooks/useAppConfig";

interface TaskTypesPanelProps {
  config: AppConfig;
  visibleTypes: Set<string>;
  onToggleVisible: (typeKey: string) => void;
  onSetAllVisible: (visible: boolean) => void;
  onQuickAdd: (typeKey: string) => void;
}

export function TaskTypesPanel({
  config,
  visibleTypes,
  onToggleVisible,
  onSetAllVisible,
  onQuickAdd,
}: TaskTypesPanelProps) {
  const types = getActiveTaskTypes(config);
  const allSelected = visibleTypes.size === types.length;
  const noneSelected = visibleTypes.size === 0;

  return (
    <div data-testid="tasktypes-panel">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium text-sm tracking-wide">Tasks</h3>
        <span
          data-testid="tasktypes-count"
          className="text-[10px] text-white/50 uppercase tracking-wider tabular-nums"
        >
          {visibleTypes.size}/{types.length}
        </span>
      </div>

      {/* Merk alle / Fjern alle */}
      <div className="flex gap-1 mb-3">
        <button
          data-testid="tasktypes-select-all"
          onClick={() => onSetAllVisible(true)}
          disabled={allSelected}
          className="flex-1 text-[11px] font-medium py-1.5 rounded-md bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Merk alle
        </button>
        <button
          data-testid="tasktypes-deselect-all"
          onClick={() => onSetAllVisible(false)}
          disabled={noneSelected}
          className="flex-1 text-[11px] font-medium py-1.5 rounded-md bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Fjern alle
        </button>
      </div>

      <div className="space-y-1">
        {types.map((t) => {
          const isVisible = visibleTypes.has(t.key);
          return (
            <div
              key={t.key}
              data-testid={`tasktype-row-${t.key}`}
              className={`group flex items-center gap-1 rounded-lg transition ${
                isVisible ? "bg-white/[0.06]" : "bg-transparent"
              } hover:bg-white/10`}
            >
              <button
                data-testid={`tasktype-toggle-${t.key}`}
                onClick={() => onToggleVisible(t.key)}
                className="flex-1 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition"
                title={isVisible ? "Klikk for å skjule" : "Klikk for å vise"}
              >
                {/* Checkbox */}
                <span
                  className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center flex-shrink-0 transition ${
                    isVisible
                      ? "border-transparent"
                      : "border-white/30 bg-transparent"
                  }`}
                  style={isVisible ? { backgroundColor: t.color } : undefined}
                >
                  {isVisible && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                </span>

                <span
                  className={`text-xs font-medium truncate flex-1 transition ${
                    isVisible ? "text-white" : "text-white/50"
                  }`}
                >
                  {t.label}
                </span>
              </button>
              <button
                data-testid={`tasktype-add-${t.key}`}
                onClick={() => onQuickAdd(t.key)}
                className="p-1.5 mr-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/15 text-white/70 hover:text-white transition"
                aria-label={`Legg til ${t.label}`}
                title={`Legg til ${t.label}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
