"use client";

import { useEffect, useState } from "react";
import { X, Trash2, CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { AppConfig, TimeSlot } from "@/lib/config";
import type { Todo } from "@/lib/types";
import { TIME_SLOTS } from "@/lib/types";
import { getActiveTaskTypes } from "@/hooks/useAppConfig";

export type ModalMode =
  | { kind: "create"; initialDate?: string; initialSlot?: TimeSlot; initialType?: string }
  | { kind: "edit"; todo: Todo };

interface TaskModalProps {
  mode: ModalMode;
  config: AppConfig;
  onClose: () => void;
  onSave: (todo: Todo) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

function generateId(): string {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatDateForInput(dateStr: string): string {
  return dateStr; // allerede YYYY-MM-DD
}

export function TaskModal({ mode, config, onClose, onSave, onDelete }: TaskModalProps) {
  const activeTypes = getActiveTaskTypes(config);
  const today = new Date().toISOString().slice(0, 10);

  const initialValues =
    mode.kind === "edit"
      ? {
          title: mode.todo.title,
          type: mode.todo.type,
          date: mode.todo.date,
          slot: mode.todo.slot,
          description: mode.todo.description ?? "",
          completed: mode.todo.completed,
        }
      : {
          title: "",
          type:
            mode.initialType ??
            activeTypes[0]?.key ??
            "OTHER",
          date: mode.initialDate ?? today,
          slot:
            mode.initialSlot ??
            (activeTypes.find((t) => t.key === (mode.initialType ?? activeTypes[0]?.key))
              ?.defaultSlot as TimeSlot) ??
            ("10-12" as TimeSlot),
          description: "",
          completed: false,
        };

  const [title, setTitle] = useState(initialValues.title);
  const [type, setType] = useState(initialValues.type);
  const [date, setDate] = useState(initialValues.date);
  const [slot, setSlot] = useState<TimeSlot>(initialValues.slot as TimeSlot);
  const [description, setDescription] = useState(initialValues.description);
  const [completed, setCompleted] = useState(initialValues.completed);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Escape lukker modalen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const now = new Date().toISOString();
    const todo: Todo =
      mode.kind === "edit"
        ? {
            ...mode.todo,
            title: title.trim(),
            type,
            date,
            slot,
            description: description.trim() || undefined,
            completed,
            updatedAt: now,
          }
        : {
            id: generateId(),
            title: title.trim(),
            type,
            date,
            slot,
            description: description.trim() || undefined,
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

  const handleDelete = async () => {
    if (mode.kind !== "edit" || !onDelete) return;
    if (!window.confirm(`Slett "${mode.todo.title}"?`)) return;
    setDeleting(true);
    try {
      await onDelete(mode.todo.id);
      onClose();
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  const selectedTypeConfig = config.taskTypes[type];

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
            {mode.kind === "edit" ? "Rediger oppgave" : "Ny oppgave"}
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
            <input
              data-testid="modal-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="F.eks. Følg opp Acme AS"
              autoFocus
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/40 placeholder:text-white/30"
            />
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
                value={formatDateForInput(date)}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
                Tidslukke
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

          {/* Ferdig-toggle */}
          <button
            data-testid="modal-completed-toggle"
            onClick={() => setCompleted(!completed)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition text-left"
          >
            {completed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-white/50 flex-shrink-0" />
            )}
            <span className={`text-sm ${completed ? "text-emerald-300" : "text-white"}`}>
              {completed ? "Markert som ferdig" : "Marker som ferdig"}
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center gap-2">
          {mode.kind === "edit" && onDelete && (
            <button
              data-testid="modal-delete-btn"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-100 text-sm font-medium transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Slett
            </button>
          )}
          <div className="flex-1" />
          <button
            data-testid="modal-cancel-btn"
            onClick={onClose}
            disabled={saving || deleting}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white text-sm font-medium transition disabled:opacity-50"
          >
            Avbryt
          </button>
          <button
            data-testid="modal-save-btn"
            onClick={handleSave}
            disabled={saving || deleting || !title.trim()}
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
      </div>
    </div>
  );
}
