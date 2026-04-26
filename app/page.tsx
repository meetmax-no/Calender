"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTodos } from "@/hooks/useTodos";
import { useAppConfig, getActiveTaskTypes } from "@/hooks/useAppConfig";
import { useUserPrefs, resolveBackgroundIndex } from "@/hooks/useUserPrefs";
import { AppHeader } from "@/components/AppHeader";
import { MiniCalendar } from "@/components/MiniCalendar";
import { TaskTypesPanel } from "@/components/TaskTypesPanel";
import { WeekView } from "@/components/WeekView";
import { MonthView } from "@/components/MonthView";
import { ListView } from "@/components/ListView";
import { LoadingToast } from "@/components/LoadingToast";
import { TaskModal, type ModalMode } from "@/components/TaskModal";
import { SettingsPanel } from "@/components/SettingsPanel";
import { WeekStats } from "@/components/WeekStats";
import type { StatusFilter } from "@/components/StatusFilterBar";
import type { TimeSlot } from "@/lib/config";
import type { Todo } from "@/lib/types";
import { toDateKey } from "@/lib/date";
import { getBranding } from "@/lib/branding";
import { isBlocked, getDependency, countBlocked } from "@/lib/deps";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Plus } from "lucide-react";

const DEFAULT_BG =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop";

export default function Home() {
  const { todos, status, error, addTodo, updateTodo, deleteTodo, toggleTodo, saveAll } = useTodos();
  const { config, status: configStatus, error: configError, requestedClient, activeClient } = useAppConfig();
  const { prefs, setPrefs } = useUserPrefs();
  const branding = getBranding();

  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month" | "list">("week");
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hasInitializedFilter = useRef(false);

  useEffect(() => {
    if (configStatus === "ready" && !hasInitializedFilter.current) {
      const all = getActiveTaskTypes(config).map((t) => t.key);
      setVisibleTypes(new Set(all));
      hasInitializedFilter.current = true;
    }
  }, [configStatus, config]);

  const isMobile = useIsMobile();

  // Tvinger Liste-visning på mobil (Uke/Måned krever stor skjerm)
  useEffect(() => {
    if (isMobile && viewMode !== "list") {
      setViewMode("list");
    }
  }, [isMobile, viewMode]);

  // Regn ut aktuelt bakgrunnsbilde basert på preferanser + config
  const backgroundUrl = useMemo(() => {
    const backgrounds = config.backgrounds ?? [];
    if (backgrounds.length === 0) return DEFAULT_BG;
    const idx = resolveBackgroundIndex(
      prefs.backgroundMode,
      prefs.backgroundIndex,
      backgrounds.length,
    );
    const bg = backgrounds[idx];
    if (!bg) return DEFAULT_BG;
    // På mobil: bruk portrett-versjon hvis den finnes
    if (isMobile && bg.urlPortrait) return bg.urlPortrait;
    return bg.url ?? DEFAULT_BG;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.backgrounds, prefs.backgroundIndex, prefs.backgroundMode, isMobile]);

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

  const handleQuickAdd = (typeKey: string) => {
    const typeConfig = config.taskTypes[typeKey];
    setModalMode({
      kind: "create",
      initialType: typeKey,
      initialDate: toDateKey(anchorDate),
      initialSlot: (typeConfig?.defaultSlot as TimeSlot) ?? "10-12",
    });
  };

  const handleCellClick = (date: Date, slot: TimeSlot) => {
    setModalMode({ kind: "create", initialDate: toDateKey(date), initialSlot: slot });
  };

  const handleTodoClick = (todo: Todo) => {
    setModalMode({ kind: "edit", todo });
  };

  const handleTodoToggle = async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    // Hard regel: kan ikke fullføre hvis avhengighet ikke er ferdig
    if (!todo.completed && isBlocked(todo, todos)) {
      const dep = getDependency(todo, todos);
      toast.error(
        dep
          ? `Fullfør "${dep.title}" først`
          : "Denne oppgaven er blokkert av en avhengighet",
      );
      return;
    }
    await toggleTodo(id);
  };

  const handleSave = async (todo: Todo) => {
    const existing = todos.find((t) => t.id === todo.id);
    if (existing) await updateTodo(todo.id, todo);
    else await addTodo(todo);
    // Sørg for at typen er synlig, slik at ny/oppdatert oppgave alltid vises
    setVisibleTypes((prev) => (prev.has(todo.type) ? prev : new Set(prev).add(todo.type)));
  };

  const handleDelete = async (id: string) => {
    await deleteTodo(id);
  };

  const handleDuplicate = async (todo: Todo) => {
    await addTodo(todo);
    setVisibleTypes((prev) => (prev.has(todo.type) ? prev : new Set(prev).add(todo.type)));
  };

  // Lagre mange todos atomisk (for gjentakende oppgaver)
  const handleSaveRecurring = async (newTodos: Todo[]) => {
    await saveAll([...todos, ...newTodos]);
    const firstType = newTodos[0]?.type;
    if (firstType) {
      setVisibleTypes((prev) => (prev.has(firstType) ? prev : new Set(prev).add(firstType)));
    }
  };

  // Tellere for statusfilter (basert på synlige typer)
  const statusCounts = useMemo(() => {
    const visible = todos.filter((t) => visibleTypes.has(t.type));
    return {
      all: visible.length,
      open: visible.filter((t) => !t.completed).length,
      done: visible.filter((t) => t.completed).length,
    };
  }, [todos, visibleTypes]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <Image
        key={backgroundUrl}
        src={backgroundUrl}
        alt="Bakgrunn"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/30" />

      <AppHeader status={status} onSettingsClick={() => setSettingsOpen(true)} />

      <main className="relative h-screen w-full pt-20 flex">
        <aside
          data-testid="app-sidebar"
          className="hidden md:flex w-72 h-full bg-white/10 backdrop-blur-xl border-r border-white/20 rounded-tr-3xl flex-col"
        >
          <div className="flex-1 p-5 flex flex-col gap-2 overflow-y-auto">
            <MiniCalendar
              selectedDate={anchorDate}
              onSelectDate={setAnchorDate}
              holidays={config.holidays}
              commercialDays={config.commercialDays}
            />

            <div className="h-px bg-white/10 my-2" />

            <WeekStats anchorDate={anchorDate} todos={todos} visibleTypes={visibleTypes} />

            <TaskTypesPanel
              config={config}
              visibleTypes={visibleTypes}
              onToggleVisible={handleToggleVisible}
              onSetAllVisible={handleSetAllVisible}
              onQuickAdd={handleQuickAdd}
            />
          </div>

          <div
            data-testid="app-footer"
            className="px-5 py-3 border-t border-white/10 text-[11px] text-white/45 font-medium tracking-wider select-none print:hidden"
          >
            {branding.name} · By Ko | Do · Consult · {branding.version}
          </div>
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
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              statusCounts={statusCounts}
              onCellClick={handleCellClick}
              onTodoClick={handleTodoClick}
              onTodoToggle={handleTodoToggle}
            />
          )}
          {viewMode === "month" && (
            <MonthView
              anchorDate={anchorDate}
              onAnchorChange={setAnchorDate}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              config={config}
              todos={todos}
              visibleTypes={visibleTypes}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              statusCounts={statusCounts}
              onCellClick={handleCellClick}
              onTodoClick={handleTodoClick}
              onTodoToggle={handleTodoToggle}
            />
          )}
          {viewMode === "list" && (
            <ListView
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              config={config}
              todos={todos}
              visibleTypes={visibleTypes}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              statusCounts={statusCounts}
              onTodoEdit={handleTodoClick}
              onTodoToggle={handleTodoToggle}
              onTodoDelete={handleDelete}
              onCreateNew={() =>
                setModalMode({ kind: "create", initialDate: toDateKey(anchorDate) })
              }
            />
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

      {/* Mobil: Floating Action Button for ny oppgave */}
      <button
        data-testid="mobile-fab-create"
        onClick={() =>
          setModalMode({ kind: "create", initialDate: toDateKey(anchorDate) })
        }
        className="md:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 active:scale-95 text-white shadow-2xl flex items-center justify-center transition"
        aria-label="Ny oppgave"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {modalMode && (
        <TaskModal
          mode={modalMode}
          config={config}
          allTodos={todos}
          onClose={() => setModalMode(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onSaveRecurring={handleSaveRecurring}
        />
      )}

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        config={config}
        todos={todos}
        backgroundIndex={prefs.backgroundIndex}
        backgroundMode={prefs.backgroundMode}
        onSelectBackground={(idx) => setPrefs({ backgroundIndex: idx })}
        onSelectMode={(mode) => setPrefs({ backgroundMode: mode })}
        requestedClient={requestedClient}
        activeClient={activeClient}
        configError={configError}
        branding={branding}
      />

      <LoadingToast status={status} configStatus={configStatus} />
    </div>
  );
}
