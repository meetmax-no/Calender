"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useTodos } from "@/hooks/useTodos";
import { useAppConfig, getActiveTaskTypes } from "@/hooks/useAppConfig";
import { AppHeader } from "@/components/AppHeader";
import { MiniCalendar } from "@/components/MiniCalendar";
import { TaskTypesPanel } from "@/components/TaskTypesPanel";
import { WeekView } from "@/components/WeekView";
import type { TimeSlot } from "@/lib/config";

export default function Home() {
  const { todos, status, error } = useTodos();
  const { config, status: configStatus } = useAppConfig();

  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set());

  // Initialiser synlige task-typer når config lastes
  useMemo(() => {
    if (configStatus === "ready" && visibleTypes.size === 0) {
      const all = getActiveTaskTypes(config).map((t) => t.key);
      setVisibleTypes(new Set(all));
    }
  }, [configStatus, config, visibleTypes.size]);

  const handleToggleVisible = (typeKey: string) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(typeKey)) next.delete(typeKey);
      else next.add(typeKey);
      return next;
    });
  };

  const handleQuickAdd = (typeKey: string) => {
    // Plassholder — steg 3 åpner modal. Logger for nå.
    console.log("Quick-add", typeKey);
  };

  const handleCellClick = (date: Date, slot: TimeSlot) => {
    // Plassholder — steg 3 åpner opprett-modal med forhåndsutfylt dato+slot.
    console.log("Cell click", date, slot);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Bakgrunnsbilde */}
      <Image
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"
        alt="Fjellandskap"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/30" />

      {/* Header */}
      <AppHeader status={status} />

      {/* Hovedlayout */}
      <main className="relative h-screen w-full pt-20 flex">
        {/* Sidebar */}
        <aside
          data-testid="app-sidebar"
          className="w-72 h-full bg-white/10 backdrop-blur-xl p-5 border-r border-white/20 rounded-tr-3xl flex flex-col gap-2 overflow-y-auto"
        >
          <MiniCalendar
            selectedDate={anchorDate}
            onSelectDate={setAnchorDate}
            holidays={config.holidays}
            commercialDays={config.commercialDays}
          />

          <div className="h-px bg-white/10 my-2" />

          <TaskTypesPanel
            config={config}
            visibleTypes={visibleTypes}
            onToggleVisible={handleToggleVisible}
            onQuickAdd={handleQuickAdd}
          />
        </aside>

        {/* Hovedinnhold */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {viewMode === "week" && (
            <WeekView
              anchorDate={anchorDate}
              onAnchorChange={setAnchorDate}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              config={config}
              todos={todos}
              visibleTypes={visibleTypes}
              onCellClick={handleCellClick}
            />
          )}
          {viewMode !== "week" && (
            <div
              data-testid="view-placeholder"
              className="flex-1 flex items-center justify-center p-8"
            >
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-white text-center max-w-md">
                <h3 className="text-lg font-semibold mb-2">
                  {viewMode === "day" ? "Dagsvisning" : "Månedsvisning"}
                </h3>
                <p className="text-sm text-white/70">
                  Kommer i et senere steg. Bytt tilbake til "Uke" for å se
                  ukevisningen.
                </p>
                <button
                  onClick={() => setViewMode("week")}
                  className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition"
                >
                  Tilbake til uke
                </button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div
              data-testid="error-banner"
              className="mx-4 mb-4 p-3 rounded-lg bg-red-500/20 border border-red-400/30 text-sm text-red-100"
            >
              <strong>Feil fra JSONBin:</strong> {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
