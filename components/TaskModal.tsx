"use client";

import { useEffect, useState } from "react";
import { X, Trash2, CheckCircle2, Circle, Loader2, Copy, Repeat, Lock } from "lucide-react";
import type { AppConfig, TimeSlot } from "@/lib/config";
import type { Todo } from "@/lib/types";
import { TIME_SLOTS } from "@/lib/types";
import { getActiveTaskTypes } from "@/hooks/useAppConfig";
import { addDays, addMonths } from "date-fns";
import { DependencyPicker } from "./DependencyPicker";
import { getDependency, isBlocked, getDependencyCandidates } from "@/lib/deps";
import { EmojiPicker } from "./EmojiPicker";
import { slotForTime } from "@/lib/slots";

export type ModalMode =
  | { kind: "create"; initialDate?: string; initialSlot?: TimeSlot; initialType?: string }
  | { kind: "edit"; todo: Todo };

type RecurrenceFrequency = "daily" | "weekly" | "biweekly" | "triweekly" | "monthly";

interface TaskModalProps {
  mode: ModalMode;
  config: AppConfig;
  /** Hele todo-listen — brukes for dependency-dropdown */
  allTodos: Todo[];
  onClose: () => void;
  onSave: (todo: Todo) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onDuplicate?: (todo: Todo) => Promise<void>;
  onSaveRecurring?: (todos: Todo[]) => Promise<void>;
}

function generateId(): string {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Parser fritekst (komma eller punktum, opp til 2 desimaler) til tall.
// Returnerer undefined hvis tomt eller ugyldig.
function parseEstimate(input: string): number | undefined {
  const trimmed = input.trim().replace(",", ".");
  if (trimmed === "") return undefined;
  const num = parseFloat(trimmed);
  if (!Number.isFinite(num) || num <= 0) return undefined;
  return Math.round(num * 100) / 100; // 2 desimaler — 0.25 forblir 0.25
}

function expandDates(
  startDate: string,
  freq: RecurrenceFrequency,
  count: number,
): string[] {
  const base = new Date(startDate + "T12:00:00Z");
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    let d: Date;
    if (freq === "daily") d = addDays(base, i);
    else if (freq === "weekly") d = addDays(base, i * 7);
    else if (freq === "biweekly") d = addDays(base, i * 14);
    else if (freq === "triweekly") d = addDays(base, i * 21);
    else d = addMonths(base, i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

export function TaskModal({
  mode,
  config,
  allTodos,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  onSaveRecurring,
}: TaskModalProps) {
  const activeTypes = getActiveTaskTypes(config);
  const today = new Date().toISOString().slice(0, 10);

  const initialValues =
    mode.kind === "edit"
      ? {
          title: mode.todo.title,
          type: mode.todo.type,
          date: mode.todo.date,
          slot: mode.todo.slot,
          time: mode.todo.time ?? "",
          description: mode.todo.description ?? "",
          estimate: mode.todo.estimateHours?.toString() ?? "",
          waitingFor: mode.todo.waitingFor,
          visibility: mode.todo.visibility ?? config.defaultVisibility ?? "public",
          completed: mode.todo.completed,
        }
      : {
          title: "",
          type: mode.initialType ?? activeTypes[0]?.key ?? "OTHER",
          date: mode.initialDate ?? today,
          slot:
            mode.initialSlot ??
            (activeTypes.find((t) => t.key === (mode.initialType ?? activeTypes[0]?.key))
              ?.defaultSlot as TimeSlot) ??
            ("10-12" as TimeSlot),
          time: "",
          description: "",
          estimate: "",
          waitingFor: undefined as string | undefined,
          visibility: (config.defaultVisibility ?? "public") as "public" | "private",
          completed: false,
        };

  const [title, setTitle] = useState(initialValues.title);
  const [type, setType] = useState(initialValues.type);
  const [date, setDate] = useState(initialValues.date);
  const [slot, setSlot] = useState<TimeSlot>(initialValues.slot as TimeSlot);
  const [time, setTime] = useState(initialValues.time);
  const [description, setDescription] = useState(initialValues.description);
  const [estimate, setEstimate] = useState(initialValues.estimate);
  const [waitingFor, setWaitingFor] = useState<string | undefined>(initialValues.waitingFor);
  const [visibility, setVisibility] = useState<"public" | "private">(initialValues.visibility);
  const [completed, setCompleted] = useState(initialValues.completed);
  const [completeBlockedHint, setCompleteBlockedHint] = useState<string | null>(null);

  // Den oppgaven vi venter på (hvis satt og finnes)
  const editingTodo = mode.kind === "edit" ? mode.todo : null;
  const candidateTodos = getDependencyCandidates(editingTodo, allTodos);
  // Sjekk om vi prøver å fullføre noe som er blokkert
  const blockingDep = waitingFor
    ? allTodos.find((t) => t.id === waitingFor && !t.completed)
    : null;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurFreq, setRecurFreq] = useState<RecurrenceFrequency>("weekly");
  const [recurCount, setRecurCount] = useState(8);

  // Escape lukker modalen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmingDelete) setConfirmingDelete(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, confirmingDelete]);

  const handleSave = async () => {
    if (!title.trim()) return;

    // Hard regel: kan ikke markere ferdig hvis avhengighet ikke er ferdig
    if (completed && blockingDep) {
      setCompleteBlockedHint(
        `Kan ikke fullføres — venter på "${blockingDep.title}"`,
      );
      return;
    }

    setSaving(true);
    const now = new Date().toISOString();

    // Gjentakende oppretter - generer N instanser
    if (mode.kind === "create" && isRecurring && onSaveRecurring) {
      const dates = expandDates(date, recurFreq, Math.max(1, Math.min(52, recurCount)));
      const parsedEstimate = parseEstimate(estimate);
      const todos: Todo[] = dates.map((d) => ({
        id: generateId(),
        title: title.trim(),
        type,
        date: d,
        slot,
        time: time || undefined,
        description: description.trim() || undefined,
        estimateHours: parsedEstimate,
        waitingFor: waitingFor || undefined,
        visibility,
        completed: false,
        createdAt: now,
        updatedAt: now,
      }));
      try {
        await onSaveRecurring(todos);
        onClose();
      } catch (err) {
        console.error(err);
        setSaving(false);
      }
      return;
    }

    const parsedEstimate = parseEstimate(estimate);
    const todo: Todo =
      mode.kind === "edit"
        ? {
            ...mode.todo,
            title: title.trim(),
            type,
            date,
            slot,
            time: time || undefined,
            description: description.trim() || undefined,
            estimateHours: parsedEstimate,
            waitingFor: waitingFor || undefined,
            visibility,
            completed,
            updatedAt: now,
          }
        : {
            id: generateId(),
            title: title.trim(),
            type,
            date,
            slot,
            time: time || undefined,
            description: description.trim() || undefined,
            estimateHours: parsedEstimate,
            waitingFor: waitingFor || undefined,
            visibility,
            completed,
            createdAt: now,
            updatedAt: now,
          };
    try {
      await onSave(todo);
      onClose();
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (mode.kind !== "edit" || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(mode.todo.id);
      onClose();
    } catch (err) {
      console.error(err);
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const handleDuplicate = async () => {
    if (mode.kind !== "edit" || !onDuplicate) return;
    setSaving(true);
    const now = new Date().toISOString();
    const copy: Todo = {
      ...mode.todo,
      id: generateId(),
      title: `${mode.todo.title} (kopi)`,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await onDuplicate(copy);
      onClose();
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const selectedTypeConfig = config.taskTypes[type];
  const isEdit = mode.kind === "edit";

  return (
    <div
      data-testid="task-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        data-testid="task-modal"
        className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-6 text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold tracking-tight">
            {isEdit ? "Rediger oppgave" : "Ny oppgave"}
          </h2>
          <button
            data-testid="modal-close-btn"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition"
            aria-label="Lukk"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Tittel */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
              Tittel
            </label>
            <div className="flex items-stretch gap-2">
              <EmojiPicker value={title} onChange={setTitle} presets={config.emojiPresets ?? []} />
              <input
                data-testid="modal-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="F.eks. Følg opp Acme AS"
                autoFocus
                className="flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/40 placeholder:text-white/30"
              />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
              Type
            </label>
            <div data-testid="modal-type-picker" className="flex flex-wrap gap-1.5">
              {activeTypes.map((t) => {
                const isActive = type === t.key;
                return (
                  <button
                    key={t.key}
                    data-testid={`modal-type-${t.key}`}
                    onClick={() => setType(t.key)}
                    className={`px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border transition ${
                      isActive
                        ? "border-white/60 shadow-md"
                        : "border-white/10 hover:border-white/30"
                    }`}
                    style={
                      isActive
                        ? { backgroundColor: t.color, color: "white" }
                        : { backgroundColor: `${t.color}20`, color: "white" }
                    }
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dato + Tidslukke */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
                Dato
              </label>
              <input
                data-testid="modal-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
                Klokkeslett <span className="text-white/40 normal-case">(valgfritt)</span>
              </label>
              <input
                data-testid="modal-time-input"
                type="time"
                value={time}
                onChange={(e) => {
                  const v = e.target.value;
                  setTime(v);
                  // Auto-velg riktig slot basert på klokkeslett
                  const auto = slotForTime(v);
                  if (auto) setSlot(auto);
                }}
                className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60 [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
              Tidslukke
              {time && (
                <span className="ml-2 text-[10px] text-blue-300/70 normal-case font-normal">
                  · auto-valgt fra klokkeslett
                </span>
              )}
            </label>
            <div className="grid grid-cols-4 gap-1" data-testid="modal-slot-picker">
              {TIME_SLOTS.map((s) => {
                const isActive = slot === s;
                return (
                  <button
                    key={s}
                    data-testid={`modal-slot-${s}`}
                    onClick={() => setSlot(s)}
                    className={`text-[10px] font-medium py-2 rounded-md transition border ${
                      isActive
                        ? "bg-blue-500 border-blue-400 text-white"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Beskrivelse */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
              Beskrivelse <span className="text-white/40 normal-case">(valgfri)</span>
            </label>
            <textarea
              data-testid="modal-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Notater, lenke, kontekst..."
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60 placeholder:text-white/30 resize-none"
            />
          </div>

          {/* Synlighet */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
              Synlighet
            </label>
            <div data-testid="modal-visibility-picker" className="inline-flex bg-white/5 border border-white/15 rounded-lg p-0.5">
              <button
                type="button"
                data-testid="modal-visibility-public"
                onClick={() => setVisibility("public")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  visibility === "public"
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:text-white/90"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Offentlig
              </button>
              <button
                type="button"
                data-testid="modal-visibility-private"
                onClick={() => setVisibility("private")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  visibility === "private"
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:text-white/90"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Privat
              </button>
            </div>
          </div>

          {/* Estimat (valgfritt) */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
              Estimat <span className="text-white/40 normal-case">(valgfri, timer)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                data-testid="modal-estimate-input"
                type="text"
                inputMode="decimal"
                value={estimate}
                onChange={(e) => setEstimate(e.target.value)}
                placeholder="F.eks. 0.5, 1, 2"
                className="w-32 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-400/60 placeholder:text-white/30"
              />
              <span className="text-xs text-white/50">timer</span>
              <div className="flex gap-1 ml-auto flex-wrap">
                {[
                  { val: "0.25", label: "15min" },
                  { val: "0.5", label: "30min" },
                  { val: "1", label: "1t" },
                  { val: "2", label: "2t" },
                  { val: "4", label: "4t" },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    data-testid={`modal-estimate-preset-${preset.val}`}
                    type="button"
                    onClick={() => setEstimate(preset.val)}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold tabular-nums bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Venter på (avhengighet) */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
              Venter på <span className="text-white/40 normal-case">(valgfri)</span>
            </label>
            <DependencyPicker
              value={waitingFor}
              candidates={candidateTodos}
              allTodos={allTodos}
              config={config}
              onChange={(id) => setWaitingFor(id)}
            />
            {waitingFor && (
              <p className="mt-1.5 text-[11px] text-amber-200/80 flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                Kan ikke fullføres før denne oppgaven er ferdig.
              </p>
            )}
          </div>

          {/* Ferdig-toggle */}
          <button
            data-testid="modal-completed-toggle"
            type="button"
            disabled={!!blockingDep && !completed}
            onClick={() => {
              if (blockingDep && !completed) {
                setCompleteBlockedHint(
                  `Kan ikke fullføres — venter på "${blockingDep.title}"`,
                );
                return;
              }
              setCompleteBlockedHint(null);
              setCompleted(!completed);
            }}
            title={
              blockingDep && !completed
                ? `Kan ikke fullføres — venter på "${blockingDep.title}"`
                : undefined
            }
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition text-left ${
              blockingDep && !completed
                ? "bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
                : "bg-white/5 hover:bg-white/10 border-white/10"
            }`}
          >
            {blockingDep && !completed ? (
              <Lock className="h-5 w-5 text-amber-300 flex-shrink-0" />
            ) : completed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-white/50 flex-shrink-0" />
            )}
            <span
              className={`text-sm ${
                blockingDep && !completed
                  ? "text-amber-200/80"
                  : completed
                    ? "text-emerald-300"
                    : "text-white"
              }`}
            >
              {blockingDep && !completed
                ? "Blokkert"
                : completed
                  ? "Markert som ferdig"
                  : "Marker som ferdig"}
            </span>
          </button>

          {completeBlockedHint && (
            <p
              data-testid="modal-completed-blocked-hint"
              className="text-[11px] text-amber-200/90 -mt-1"
            >
              {completeBlockedHint}
            </p>
          )}

          {/* Gjentakelse — kun ved opprettelse */}
          {!isEdit && (
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <button
                data-testid="modal-recurring-toggle"
                onClick={() => setIsRecurring(!isRecurring)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-white/5 hover:bg-white/10 transition text-left"
              >
                <Repeat
                  className={`h-4 w-4 flex-shrink-0 ${
                    isRecurring ? "text-blue-300" : "text-white/50"
                  }`}
                />
                <span className={`text-sm flex-1 ${isRecurring ? "text-blue-200" : "text-white"}`}>
                  Gjenta oppgaven
                </span>
                <span className="text-[10px] text-white/40 uppercase tracking-wider">
                  {isRecurring ? "På" : "Av"}
                </span>
              </button>
              {isRecurring && (
                <div className="p-3 bg-blue-500/5 border-t border-blue-400/20 space-y-2.5">
                  <div className="grid grid-cols-[1fr_80px] gap-2">
                    <div>
                      <label className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">
                        Hyppighet
                      </label>
                      <select
                        data-testid="modal-recur-freq"
                        value={recurFreq}
                        onChange={(e) => setRecurFreq(e.target.value as RecurrenceFrequency)}
                        className="mt-1 w-full bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                      >
                        <option value="daily">Hver dag</option>
                        <option value="weekly">Hver uke</option>
                        <option value="biweekly">Hver 2. uke</option>
                        <option value="triweekly">Hver 3. uke</option>
                        <option value="monthly">Månedlig</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">
                        Antall
                      </label>
                      <input
                        data-testid="modal-recur-count"
                        type="number"
                        min={2}
                        max={52}
                        value={recurCount}
                        onChange={(e) =>
                          setRecurCount(Math.max(2, Math.min(52, parseInt(e.target.value) || 2)))
                        }
                        className="mt-1 w-full bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-sm text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-white/50 leading-tight">
                    Oppretter {recurCount}{" "}
                    {recurCount === 1 ? "oppgave" : "oppgaver"} med samme tittel, type og
                    tidslukke — starter fra datoen over.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - bytter utseende i slett-bekreftelse */}
        <div className="mt-6">
          {confirmingDelete ? (
            <div
              data-testid="delete-confirm-bar"
              className="rounded-lg bg-red-500/15 border border-red-400/30 p-3 flex items-center gap-3"
            >
              <Trash2 className="h-4 w-4 text-red-300 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <p className="text-red-100 font-medium">Slett denne oppgaven?</p>
                <p className="text-red-200/70 text-xs mt-0.5">
                  Kan ikke angres.
                </p>
              </div>
              <button
                data-testid="delete-confirm-cancel"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition"
              >
                Avbryt
              </button>
              <button
                data-testid="delete-confirm-ok"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                autoFocus
              >
                {deleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                Ja, slett
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isEdit && onDelete && (
                <button
                  data-testid="modal-delete-btn"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={saving}
                  className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-100 text-sm font-medium transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  Slett
                </button>
              )}
              {isEdit && onDuplicate && (
                <button
                  data-testid="modal-duplicate-btn"
                  onClick={handleDuplicate}
                  disabled={saving}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white text-sm font-medium transition disabled:opacity-50 flex items-center gap-1.5"
                  title="Opprett en kopi"
                >
                  <Copy className="h-4 w-4" />
                  Dupliser
                </button>
              )}
              <div className="flex-1" />
              <button
                data-testid="modal-cancel-btn"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white text-sm font-medium transition disabled:opacity-50"
              >
                Avbryt
              </button>
              <button
                data-testid="modal-save-btn"
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium shadow-lg transition disabled:opacity-50 flex items-center gap-1.5"
                style={
                  selectedTypeConfig && !saving && title.trim()
                    ? { backgroundColor: selectedTypeConfig.color }
                    : undefined
                }
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Lagrer...
                  </>
                ) : (
                  "Lagre"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
