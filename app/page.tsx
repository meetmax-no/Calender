"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTodos } from "@/hooks/useTodos";
import { useAppConfig, getActiveTaskTypes } from "@/hooks/useAppConfig";
import { AppHeader } from "@/components/AppHeader";
import { MiniCalendar } from "@/components/MiniCalendar";
import { TaskTypesPanel } from "@/components/TaskTypesPanel";
import { WeekView } from "@/components/WeekView";
import { TaskModal, type ModalMode } from "@/components/TaskModal";
import type { TimeSlot } from "@/lib/config";
import type { Todo } from "@/lib/types";
import { toDateKey } from "@/lib/date";

export default function Home() {
  const { todos, status, error, addTodo, updateTodo, deleteTodo, toggleTodo } = useTodos();
  const { config, status: configStatus } = useAppConfig();

  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set());
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const hasInitializedFilter = useRef(false);

  useEffect(() => {
    if (configStatus === "ready" && !hasInitializedFilter.current) {
      const all = getActiveTaskTypes(config).map((t) => t.key);
      setVisibleTypes(new Set(all));
      hasInitializedFilter.current = true;
    }
  }, [configStatus, config]);

  const handleToggleVisible = (typeKey: string) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(typeKey)) next.delete(typeKey);
      else next.add(typeKey);
      return next;
    });
  };

  const handleSetAllVisible = (visible: boolean) => {
    if (visible) {
      const all = getActiveTaskTypes(config).map((t) => t.key);
      setVisibleTypes(new Set(all));
    } else {
      setVisibleTypes(new Set());
    }
  };

  // Quick-add fra Tasks-panelet (+ ikon)
  const handleQuickAdd = (typeKey: string) => {
    const typeConfig = config.taskTypes[typeKey];
    setModalMode({
      kind: "create",
      initialType: typeKey,
      initialDate: toDateKey(anchorDate),
      initialSlot: (typeConfig?.defaultSlot as TimeSlot) ?? "10-12",
    });
  };

  // Klikk på tom celle i grid
  const handleCellClick = (date: Date, slot: TimeSlot) => {
    setModalMode({
      kind: "create",
      initialDate: toDateKey(date),
      initialSlot: slot,
    });
  };

  // Klikk på eksisterende todo
  const handleTodoClick = (todo: Todo) => {
    setModalMode({ kind: "edit", todo });
  };

  const handleTodoToggle = async (id: string) => {
    await toggleTodo(id);
  };

  const handleSave = async (todo: Todo) => {
    const existing = todos.find((t) => t.id === todo.id);
    if (existing) {
      await updateTodo(todo.id, todo);
    } else {
      await addTodo(todo);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTodo(id);
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
      <div className="absolute inset-0 bg-black/30" />

      <AppHeader status={status} />

      <main className="relative h-screen w-full pt-20 flex">
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
            onSetAllVisible={handleSetAllVisible}
            onQuickAdd={handleQuickAdd}
          />
        </aside>

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
              onTodoClick={handleTodoClick}
              onTodoToggle={handleTodoToggle}
            />
          )}
          {viewMode !== "week" && (
            <div
              data-testid="view-placeholder"
              className="flex-1 flex items-center justify-center p-8"
            >
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-white text-center max-w-md">
                <h3 className="text-lg font-semibold mb-2">Månedsvisning</h3>
                <p className="text-sm text-white/70">
                  Kommer i et senere steg. Bytt tilbake til &quot;Uke&quot; for å
                  se ukevisningen.
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

      {modalMode && (
        <TaskModal
          mode={modalMode}
          config={config}
          onClose={() => setModalMode(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
