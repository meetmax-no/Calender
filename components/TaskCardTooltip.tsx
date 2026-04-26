"use client";

import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, Lock } from "lucide-react";

interface TaskCardTooltipProps {
  description?: string;
  estimateHours?: number;
  /** Hvis satt: viser "Venter på X" som blokkering-info */
  blockedBy?: string;
  children: ReactNode;
}

/**
 * Wrapper rundt et oppgave-kort som viser en hover-tooltip
 * med beskrivelse, estimat og evt. blokkerings-info.
 * Vises hvis MINST ÉN av disse finnes: beskrivelse, blockedBy.
 */
export function TaskCardTooltip({
  description,
  estimateHours,
  blockedBy,
  children,
}: TaskCardTooltipProps) {
  const hasDescription = description && description.trim() !== "";
  const hasBlocked = Boolean(blockedBy);

  // Vis ingen tooltip hvis det ikke er noe å fortelle
  if (!hasDescription && !hasBlocked) {
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
            <div
              data-testid="task-tooltip-blocked"
              className={`flex items-center gap-1.5 text-[11px] text-amber-200 ${
                hasDescription ? "mt-1.5 pt-1.5 border-t border-white/15" : ""
              }`}
            >
              <Lock className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                Venter på: <strong className="font-semibold">{blockedBy}</strong>
              </span>
            </div>
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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function formatHours(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} min`;
  }
  const isWhole = hours % 1 === 0;
  return `${isWhole ? hours : hours.toFixed(1).replace(".", ",")}t`;
}
