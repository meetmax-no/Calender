"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addWeeks,
  subWeeks,
  getMonthCells,
  formatMonthTitle,
  toDateKey,
  isSameDay,
} from "@/lib/date";
import { useState } from "react";

interface MiniCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  holidays: Record<string, string>;
  commercialDays: Record<string, string>;
}

export function MiniCalendar({
  selectedDate,
  onSelectDate,
  holidays,
  commercialDays,
}: MiniCalendarProps) {
  // Anchor er hvilken måned som vises i mini-kalenderen
  const [anchor, setAnchor] = useState<Date>(selectedDate);
  const cells = getMonthCells(anchor);
  const today = new Date();

  const weekdayLabels = ["M", "T", "O", "T", "F", "L", "S"];

  return (
    <div data-testid="mini-calendar" className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium text-sm">{formatMonthTitle(anchor)}</h3>
        <div className="flex gap-0.5">
          <button
            data-testid="mini-cal-prev"
            onClick={() => setAnchor(subWeeks(anchor, 4))}
            className="p-1 rounded-full hover:bg-white/20 transition"
            aria-label="Forrige måned"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-white" />
          </button>
          <button
            data-testid="mini-cal-next"
            onClick={() => setAnchor(addWeeks(anchor, 4))}
            className="p-1 rounded-full hover:bg-white/20 transition"
            aria-label="Neste måned"
          >
            <ChevronRight className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {weekdayLabels.map((d, i) => (
          <div key={i} className="text-[10px] text-white/50 font-medium py-1">
            {d}
          </div>
        ))}

        {cells.map((date, i) => {
          if (!date) return <div key={`e-${i}`} className="h-7" />;
          const key = toDateKey(date);
          const isSelected = isSameDay(date, selectedDate);
          const isTod = isSameDay(date, today);
          const isHoliday = !!holidays[key];
          const isCommercial = !!commercialDays[key];

          const baseCls =
            "text-xs rounded-full w-7 h-7 flex items-center justify-center transition cursor-pointer relative";
          let styleCls = "text-white hover:bg-white/20";
          if (isSelected) styleCls = "bg-blue-500 text-white font-semibold shadow-md";
          else if (isTod) styleCls = "bg-white/25 text-white font-semibold";
          else if (isHoliday) styleCls = "text-red-300 hover:bg-white/20";

          return (
            <button
              key={key}
              data-testid={`mini-cal-day-${key}`}
              onClick={() => onSelectDate(date)}
              className={`${baseCls} ${styleCls}`}
              title={holidays[key] || commercialDays[key] || undefined}
            >
              {date.getDate()}
              {isCommercial && !isSelected && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-amber-300" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
