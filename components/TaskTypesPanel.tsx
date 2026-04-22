"use client";

import { Plus } from "lucide-react";
import type { AppConfig } from "@/lib/config";
import { getActiveTaskTypes } from "@/hooks/useAppConfig";

interface TaskTypesPanelProps {
  config: AppConfig;
  visibleTypes: Set<string>;
  onToggleVisible: (typeKey: string) => void;
  onQuickAdd: (typeKey: string) => void;
}

export function TaskTypesPanel({
  config,
  visibleTypes,
  onToggleVisible,
  onQuickAdd,
}: TaskTypesPanelProps) {
  const types = getActiveTaskTypes(config);

  return (
    <div data-testid="tasktypes-panel">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium text-sm">Mine oppgaver</h3>
        <span className="text-[10px] text-white/50 uppercase tracking-wider">
          {visibleTypes.size}/{types.length}
        </span>
      </div>

      <div className="space-y-1.5">
        {types.map((t) => {
          const isVisible = visibleTypes.has(t.key);
          return (
            <div
              key={t.key}
              data-testid={`tasktype-row-${t.key}`}
              className="group flex items-center gap-2 rounded-lg hover:bg-white/5 transition"
            >
              <button
                data-testid={`tasktype-toggle-${t.key}`}
                onClick={() => onToggleVisible(t.key)}
                className={`flex-1 flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition ${
                  isVisible ? "" : "opacity-40"
                }`}
                title={isVisible ? "Skjul" : "Vis"}
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: t.color }}
                />
                <span className="text-xs text-white font-medium truncate text-left flex-1">
                  {t.label}
                </span>
              </button>
              <button
                data-testid={`tasktype-add-${t.key}`}
                onClick={() => onQuickAdd(t.key)}
                className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 text-white/70 hover:text-white transition"
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
