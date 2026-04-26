"use client";

import { useMemo } from "react";
import type { Todo } from "@/lib/types";
import { getWeekDays, toDateKey } from "@/lib/date";
import { formatHours } from "./TaskCardTooltip";
import { isBlocked } from "@/lib/deps";

interface WeekStatsProps {
  anchorDate: Date;
  todos: Todo[];
  visibleTypes: Set<string>;
}

export function WeekStats({ anchorDate, todos, visibleTypes }: WeekStatsProps) {
  const { total, done, overdue, blocked, estimateOpen, estimateDone } = useMemo(() => {
    const weekDays = getWeekDays(anchorDate);
    const weekKeys = new Set(weekDays.map((d) => toDateKey(d)));
    const todayKey = toDateKey(new Date());

    const inWeek = todos.filter(
      (t) => visibleTypes.has(t.type) && weekKeys.has(t.date),
    );
    const done = inWeek.filter((t) => t.completed).length;
    const overdue = todos.filter(
      (t) =>
        visibleTypes.has(t.type) &&
        !t.completed &&
        t.date < todayKey,
    ).length;

    // Blokkerte i hele synlige settet (ikke bare uka) — for å gi totaloversikt
    const blocked = todos.filter(
      (t) =>
        visibleTypes.has(t.type) &&
        !t.completed &&
        isBlocked(t, todos),
    ).length;

    const estimateOpen = inWeek
      .filter((t) => !t.completed && t.estimateHours !== undefined)
      .reduce((sum, t) => sum + (t.estimateHours ?? 0), 0);
    const estimateDone = inWeek
      .filter((t) => t.completed && t.estimateHours !== undefined)
      .reduce((sum, t) => sum + (t.estimateHours ?? 0), 0);

    return {
      total: inWeek.length,
      done,
      overdue,
      blocked,
      estimateOpen: Math.round(estimateOpen * 10) / 10,
      estimateDone: Math.round(estimateDone * 10) / 10,
    };
  }, [anchorDate, todos, visibleTypes]);

  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div
      data-testid="week-stats"
      className="mb-5 rounded-xl bg-white/[0.04] border border-white/10 p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-white/80 tracking-wider uppercase">
          Denne uken
        </h3>
        {total > 0 && (
          <span
            data-testid="week-stats-percent"
            className={`text-[11px] font-semibold tabular-nums ${
              percent === 100
                ? "text-emerald-300"
                : percent >= 50
                  ? "text-amber-200"
                  : "text-white/60"
            }`}
          >
            {percent}%
          </span>
        )}
      </div>

      {total === 0 ? (
        <p className="text-[11px] text-white/50">Ingen oppgaver denne uken ennå.</p>
      ) : (
        <>
          <div className="flex items-baseline gap-1 mb-2.5">
            <span data-testid="week-stats-done" className="text-xl font-semibold text-white tabular-nums">
              {done}
            </span>
            <span className="text-xs text-white/50">/</span>
            <span data-testid="week-stats-total" className="text-xs text-white/60 tabular-nums">
              {total}
            </span>
            <span className="text-[10px] text-white/50 ml-1">ferdig</span>
          </div>

          {/* Fremdrift */}
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              data-testid="week-stats-bar"
              className={`h-full rounded-full transition-all duration-500 ${
                percent === 100
                  ? "bg-emerald-400"
                  : percent >= 50
                    ? "bg-amber-300"
                    : "bg-blue-400"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Overdue advarsel */}
          {overdue > 0 && (
            <p
              data-testid="week-stats-overdue"
              className="mt-2 text-[11px] text-rose-200 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              {overdue} {overdue === 1 ? "forsinket" : "forsinkede"}
            </p>
          )}

          {/* Blokkerte oppgaver */}
          {blocked > 0 && (
            <p
              data-testid="week-stats-blocked"
              className="mt-1.5 text-[11px] text-amber-200 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {blocked} {blocked === 1 ? "blokkert" : "blokkerte"}
            </p>
          )}

          {/* Estimat-sum (vises bare hvis noen oppgaver har estimat) */}
          {(estimateOpen > 0 || estimateDone > 0) && (
            <div
              data-testid="week-stats-estimate"
              className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]"
            >
              <span className="text-white/50 uppercase tracking-wider font-semibold text-[10px]">
                Estimat
              </span>
              <span className="text-white/80 tabular-nums font-medium">
                {estimateDone > 0 && (
                  <span className="text-emerald-300/80">
                    {formatHours(estimateDone)}
                  </span>
                )}
                {estimateDone > 0 && estimateOpen > 0 && (
                  <span className="text-white/30 mx-1">·</span>
                )}
                {estimateOpen > 0 && (
                  <span data-testid="week-stats-estimate-open">
                    {formatHours(estimateOpen)} igjen
                  </span>
                )}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
