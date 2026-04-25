"use client";

import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock } from "lucide-react";

interface TaskCardTooltipProps {
  description?: string;
  estimateHours?: number;
  children: ReactNode;
}

/**
 * Wrapper rundt et oppgave-kort som viser en hover-tooltip
 * med beskrivelse og estimat. Vises KUN hvis beskrivelse finnes.
 * Estimatet vises som ekstra linje hvis satt.
 */
export function TaskCardTooltip({
  description,
  estimateHours,
  children,
}: TaskCardTooltipProps) {
  // Vis ingen tooltip hvis det ikke er noen beskrivelse å vise
  if (!description || description.trim() === "") {
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
          className="max-w-[280px] bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl px-3 py-2.5"
          data-testid="task-tooltip"
        >
          <p className="text-[12px] leading-snug whitespace-pre-wrap break-words text-white/95">
            {description}
          </p>
          {estimateHours !== undefined && (
            <div className="mt-1.5 pt-1.5 border-t border-white/15 flex items-center gap-1.5 text-[10px] text-white/70 font-semibold uppercase tracking-wider">
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
