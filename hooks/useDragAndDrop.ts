"use client";

import { useState, useCallback } from "react";
import type { TimeSlot } from "@/lib/config";

const DRAG_MIME = "application/x-kodo-todo-id";

export interface DragState {
  activeId: string | null;
  hoverKey: string | null; // "YYYY-MM-DD" eller "YYYY-MM-DD_slot"
}

/**
 * Hook for HTML5 drag-and-drop av oppgaver mellom celler.
 * - Returnerer handlers som settes på hhv. todo-kortet og målcellene.
 * - Bruker en custom MIME-type for å være tolerant for ekstern drag (filer osv.).
 * - Hvis slot === undefined ved drop → callback får undefined (kall-stedet beholder eksisterende slot).
 */
export function useDragAndDrop(opts: {
  enabled: boolean;
  onMove: (id: string, date: string, slot: TimeSlot | undefined) => void;
}) {
  const { enabled, onMove } = opts;
  const [state, setState] = useState<DragState>({ activeId: null, hoverKey: null });

  const startDrag = useCallback(
    (id: string) => (e: React.DragEvent) => {
      if (!enabled) return;
      e.dataTransfer.setData(DRAG_MIME, id);
      e.dataTransfer.effectAllowed = "move";
      setState({ activeId: id, hoverKey: null });
    },
    [enabled],
  );

  const endDrag = useCallback(() => {
    setState({ activeId: null, hoverKey: null });
  }, []);

  const overCell = useCallback(
    (cellKey: string) => (e: React.DragEvent) => {
      if (!enabled) return;
      if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setState((prev) => (prev.hoverKey === cellKey ? prev : { ...prev, hoverKey: cellKey }));
    },
    [enabled],
  );

  const leaveCell = useCallback(
    (cellKey: string) => () => {
      if (!enabled) return;
      setState((prev) => (prev.hoverKey === cellKey ? { ...prev, hoverKey: null } : prev));
    },
    [enabled],
  );

  const dropOnCell = useCallback(
    (date: string, slot: TimeSlot | undefined) => (e: React.DragEvent) => {
      if (!enabled) return;
      const id = e.dataTransfer.getData(DRAG_MIME);
      if (!id) return;
      e.preventDefault();
      e.stopPropagation();
      onMove(id, date, slot);
      setState({ activeId: null, hoverKey: null });
    },
    [enabled, onMove],
  );

  return { state, startDrag, endDrag, overCell, leaveCell, dropOnCell };
}
