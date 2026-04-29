"use client";

import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, Lock } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";

interface TaskCardTooltipProps {
  description?: string;
  estimateHours?: number;
  /** Hvis satt: viser "Venter på X" som blokkering-info */
  blockedBy?: string;
  /** Callback når brukeren klikker på "Venter på"-linjen i tooltip */
  onBlockedClick?: () => void;
  children: ReactNode;
}

/**
 * Wrapper rundt et oppgave-kort som viser en hover-tooltip
 * med beskrivelse, estimat og evt. blokkerings-info.
 * Vises hvis MINST ÉN av disse finnes: beskrivelse, blockedBy.
 * I tillegg vises et lite hint på desktop om at høyreklikk = utsette.
 */
export function TaskCardTooltip({
  description,
  estimateHours,
  blockedBy,
  onBlockedClick,
  children,
}: TaskCardTooltipProps) {
  const isMobile = useIsMobile();
  const hasDescription = description && description.trim() !== "";
  const hasBlocked = Boolean(blockedBy);
  // Hintet vises kun på desktop (høyreklikk er meningsløst på touch)
  const showSnoozeHint = !isMobile;

  // Vis ingen tooltip hvis det ikke er noe å fortelle (og ingen hint)
  if (!hasDescription && !hasBlocked && !showSnoozeHint) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          sideOffset={6}
          onPointerDownOutside={(e) => e.preventDefault()}
          className="pointer-events-auto max-w-[280px] bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl px-3 py-2.5"
          data-testid="task-tooltip"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {hasDescription && (
            <p className="text-[12px] leading-snug whitespace-pre-wrap break-words text-white/95">
              {description}
            </p>
          )}
          {hasBlocked && (
            <button
              type="button"
              data-testid="task-tooltip-blocked"
              onClick={(e) => {
                e.stopPropagation();
                onBlockedClick?.();
              }}
              disabled={!onBlockedClick}
              className={`flex items-center gap-1.5 text-[11px] text-amber-200 w-full text-left transition ${
                hasDescription ? "mt-1.5 pt-1.5 border-t border-white/15" : ""
              } ${onBlockedClick ? "hover:text-amber-100 cursor-pointer" : ""}`}
            >
              <Lock className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                Venter på:{" "}
                <strong
                  className={`font-semibold ${
                    onBlockedClick ? "underline decoration-dotted underline-offset-2" : ""
                  }`}
                >
                  {blockedBy}
                </strong>
              </span>
            </button>
          )}
          {estimateHours !== undefined && (
            <div
              className={`flex items-center gap-1.5 text-[10px] text-white/70 font-semibold uppercase tracking-wider ${
                hasDescription || hasBlocked
                  ? "mt-1.5 pt-1.5 border-t border-white/15"
                  : ""
              }`}
            >
              <Clock className="h-3 w-3" />
              <span className="tabular-nums">{formatHours(estimateHours)}</span>
            </div>
          )}
          {showSnoozeHint && (
            <div
              data-testid="task-tooltip-snooze-hint"
              className={`flex items-center gap-1 text-[10px] text-white/40 ${
                hasDescription || hasBlocked || estimateHours !== undefined
                  ? "mt-1.5 pt-1.5 border-t border-white/10"
                  : ""
              }`}
            >
              <span aria-hidden>💡</span>
              <span>Høyreklikk for å utsette</span>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function formatHours(hours: number): string {
  if (hours <= 0) return "0 min";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}t`;
  return `${h}t ${m}min`;
}

/** Liten farget prikk for å markere synlighet. Blå=public, grønn=privat. */
export function VisibilityDot({
  visibility,
  className = "",
}: {
  visibility?: "public" | "private";
  defaultVisibility?: "public" | "private";
  className?: string;
}) {
  const v = visibility ?? "public";
  const color = v === "private" ? "bg-emerald-400" : "bg-blue-400";
  const label = v === "private" ? "Privat" : "Offentlig";
  return (
    <span
      data-testid={`visibility-dot-${v}`}
      title={label}
      aria-label={label}
      className={`inline-block w-1.5 h-1.5 rounded-full ${color} ${className}`}
    />
  );
}
