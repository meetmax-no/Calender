"use client";

export type StatusFilter = "all" | "open" | "done";

interface StatusFilterBarProps {
  value: StatusFilter;
  onChange: (next: StatusFilter) => void;
  counts: { all: number; open: number; done: number };
  testIdPrefix?: string;
}

export function StatusFilterBar({
  value,
  onChange,
  counts,
  testIdPrefix = "status-filter",
}: StatusFilterBarProps) {
  return (
    <div
      data-testid={testIdPrefix}
      className="flex items-center gap-0.5 bg-white/5 border border-white/15 rounded-lg p-0.5"
    >
      <FilterPill
        testId={`${testIdPrefix}-all`}
        active={value === "all"}
        onClick={() => onChange("all")}
        label="Alle"
        count={counts.all}
      />
      <FilterPill
        testId={`${testIdPrefix}-open`}
        active={value === "open"}
        onClick={() => onChange("open")}
        label="Åpne"
        count={counts.open}
        accent="amber"
      />
      <FilterPill
        testId={`${testIdPrefix}-done`}
        active={value === "done"}
        onClick={() => onChange("done")}
        label="Ferdig"
        count={counts.done}
        accent="emerald"
      />
    </div>
  );
}

interface FilterPillProps {
  testId: string;
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  accent?: "amber" | "emerald";
}

function FilterPill({ testId, active, onClick, label, count, accent }: FilterPillProps) {
  const activeBg =
    accent === "emerald"
      ? "bg-emerald-500/25 text-emerald-100"
      : accent === "amber"
        ? "bg-amber-500/25 text-amber-100"
        : "bg-white/20 text-white";
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
        active ? activeBg : "text-white/60 hover:text-white hover:bg-white/10"
      }`}
    >
      {label}
      <span
        className={`text-[10px] font-semibold tabular-nums px-1.5 rounded-full ${
          active ? "bg-black/20" : "bg-white/10 text-white/60"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
