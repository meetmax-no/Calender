"use client";

import { useState, useRef, useEffect } from "react";
import { Smile, X } from "lucide-react";

/**
 * Sjekk om første "tegn" i strengen er en emoji (Extended_Pictographic).
 * Returnerer det første grafem-clusteret + resten, eller null/full streng.
 */
export function splitEmojiPrefix(text: string): {
  emoji: string | null;
  rest: string;
} {
  if (!text) return { emoji: null, rest: "" };
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const iter = seg.segment(text)[Symbol.iterator]();
    const first = iter.next().value;
    if (!first) return { emoji: null, rest: text };
    const cluster = first.segment as string;
    if (/^\p{Extended_Pictographic}/u.test(cluster)) {
      return { emoji: cluster, rest: text.slice(cluster.length).trimStart() };
    }
    return { emoji: null, rest: text };
  }
  const match = text.match(/^(\p{Extended_Pictographic}\uFE0F?)\s*(.*)$/u);
  if (match) return { emoji: match[1], rest: match[2] };
  return { emoji: null, rest: text };
}

interface EmojiPickerProps {
  /** Nåværende tittel (kan inneholde emoji-prefix) */
  value: string;
  /** Kalles når brukeren velger en emoji eller fjerner */
  onChange: (newValue: string) => void;
  /** Liste av emojis å vise. Fra config.emojiPresets. */
  presets: string[];
}

export function EmojiPicker({ value, onChange, presets }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { emoji: currentEmoji, rest } = splitEmojiPrefix(value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Hvis ingen presets er konfigurert, ikke render picker-knappen
  if (!presets || presets.length === 0) return null;

  const setEmoji = (e: string | null) => {
    const cleanRest = rest;
    if (e) {
      onChange(`${e} ${cleanRest}`.trim());
    } else {
      onChange(cleanRest);
    }
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        data-testid="emoji-picker-toggle"
        onClick={() => setOpen((o) => !o)}
        className="h-9 w-9 flex-shrink-0 rounded-lg bg-white/5 hover:bg-white/15 border border-white/15 flex items-center justify-center text-base transition"
        title={currentEmoji ? "Endre eller fjern emoji" : "Legg til emoji"}
        aria-label="Velg emoji"
      >
        {currentEmoji ? (
          <span className="text-lg leading-none">{currentEmoji}</span>
        ) : (
          <Smile className="h-4 w-4 text-white/60" />
        )}
      </button>

      {open && (
        <div
          data-testid="emoji-picker-panel"
          className="absolute z-50 top-full mt-2 left-0 bg-slate-900 border border-white/20 rounded-xl shadow-2xl p-2 w-[180px]"
        >
          <div className="grid grid-cols-3 gap-1">
            {presets.map((e) => (
              <button
                key={e}
                type="button"
                data-testid={`emoji-option-${e}`}
                onClick={() => setEmoji(e)}
                className={`w-12 h-10 rounded-md text-xl leading-none transition flex items-center justify-center ${
                  currentEmoji === e
                    ? "bg-blue-500/30 ring-1 ring-blue-400/50"
                    : "hover:bg-white/10"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          {currentEmoji && (
            <button
              type="button"
              data-testid="emoji-clear-btn"
              onClick={() => setEmoji(null)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-400/30 text-[11px] text-white/70 hover:text-rose-200 transition"
            >
              <X className="h-3 w-3" />
              Fjern emoji
            </button>
          )}
        </div>
      )}
    </div>
  );
}
