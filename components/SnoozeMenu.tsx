"use client";

// Floating kontekstmeny for å utsette en oppgave til ny dato.
// Aktiveres via høyreklikk (desktop) eller long-press (mobil).
// Posisjoneres ved peker-koordinatene; lukkes på outside click + Escape.

import { useEffect, useRef, useState } from "react";
import { Clock, CalendarDays, ArrowRight, CalendarPlus } from "lucide-react";
import { computeSnoozeDate, getSnoozePreview, type SnoozeTarget } from "@/lib/snooze";

interface SnoozeMenuProps {
  /** X-koordinat (clientX fra event) */
  x: number;
  /** Y-koordinat (clientY fra event) */
  y: number;
  /** Kalles med ny dato (yyyy-MM-dd) når brukeren har valgt */
  onSelect: (newDate: string) => void;
  /** Lukk menyen uten valg */
  onClose: () => void;
}

const PRESETS: Array<{
  target: Exclude<SnoozeTarget, "custom">;
  Icon: typeof Clock;
  testId: string;
}> = [
  { target: "tomorrow", Icon: Clock, testId: "snooze-tomorrow" },
  { target: "monday", Icon: CalendarDays, testId: "snooze-monday" },
  { target: "next-week", Icon: ArrowRight, testId: "snooze-next-week" },
];

export function SnoozeMenu({ x, y, onSelect, onClose }: SnoozeMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number }>({
    left: x,
    top: y,
  });

  // Juster posisjon hvis menyen ville ramlet utenfor viewport
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    let left = x;
    let top = y;
    if (left + rect.width + margin > window.innerWidth) {
      left = window.innerWidth - rect.width - margin;
    }
    if (top + rect.height + margin > window.innerHeight) {
      top = window.innerHeight - rect.height - margin;
    }
    if (left < margin) left = margin;
    if (top < margin) top = margin;
    setPosition({ left, top });
  }, [x, y]);

  // Lukk på Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lukk på outside-click
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const el = menuRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) onClose();
    };
    // Liten delay slik at åpningsklikket ikke selv lukker menyen
    const t = setTimeout(() => {
      window.addEventListener("pointerdown", onPointerDown);
    }, 50);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [onClose]);

  const handlePreset = (target: Exclude<SnoozeTarget, "custom">) => {
    onSelect(computeSnoozeDate(target));
  };

  const handleCustom = () => {
    // Åpne native date picker
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.click();
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) return;
    onSelect(computeSnoozeDate("custom", value));
  };

  return (
    <div
      data-testid="snooze-menu"
      ref={menuRef}
      role="menu"
      aria-label="Utsett oppgave"
      className="fixed z-[60] min-w-[220px] rounded-xl border border-white/15 bg-slate-900/95 backdrop-blur-xl shadow-2xl text-white py-1.5 animate-in fade-in zoom-in-95 duration-100"
      style={{ left: position.left, top: position.top }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
        Utsett til
      </div>
      <div className="h-px bg-white/10 mx-2 mb-1" />

      {PRESETS.map(({ target, Icon, testId }) => {
        const { label, preview } = getSnoozePreview(target);
        return (
          <button
            key={target}
            data-testid={testId}
            role="menuitem"
            onClick={() => handlePreset(target)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/10 transition group"
          >
            <Icon className="h-3.5 w-3.5 text-white/70 group-hover:text-white flex-shrink-0" />
            <span className="text-[13px] flex-1">{label}</span>
            <span className="text-[10px] text-white/40 tabular-nums whitespace-nowrap">
              {preview}
            </span>
          </button>
        );
      })}

      <div className="h-px bg-white/10 mx-2 my-1" />

      <button
        data-testid="snooze-custom"
        role="menuitem"
        onClick={handleCustom}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/10 transition group"
      >
        <CalendarPlus className="h-3.5 w-3.5 text-white/70 group-hover:text-white flex-shrink-0" />
        <span className="text-[13px] flex-1">Velg dato…</span>
      </button>

      {/* Skjult native date input — triggeres fra "Velg dato…"-knappen */}
      <input
        data-testid="snooze-custom-date-input"
        ref={dateInputRef}
        type="date"
        onChange={handleCustomChange}
        className="absolute opacity-0 pointer-events-none w-0 h-0"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}
