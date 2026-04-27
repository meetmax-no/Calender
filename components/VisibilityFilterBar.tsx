"use client";

interface VisibilityFilterBarProps {
  value: "all" | "public" | "private";
  onChange: (value: "all" | "public" | "private") => void;
  counts: { all: number; public: number; private: number };
}

export function VisibilityFilterBar({
  value,
  onChange,
  counts,
}: VisibilityFilterBarProps) {
  const options: Array<{
    key: "all" | "public" | "private";
    label: string;
    dot: string | null;
  }> = [
    { key: "all", label: "Alle", dot: null },
    { key: "public", label: "Offentlig", dot: "bg-blue-400" },
    { key: "private", label: "Privat", dot: "bg-emerald-400" },
  ];

  return (
    <div data-testid="visibility-filter-bar" className="space-y-1.5">
      <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
        Synlighet
      </div>
      <div className="inline-flex w-full bg-white/5 border border-white/10 rounded-lg p-0.5">
        {options.map((o) => {
          const active = value === o.key;
          const count = counts[o.key];
          return (
            <button
              key={o.key}
              data-testid={`visibility-filter-${o.key}`}
              onClick={() => onChange(o.key)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white/85"
              }`}
            >
              {o.dot && <span className={`w-1.5 h-1.5 rounded-full ${o.dot}`} />}
              <span>{o.label}</span>
              <span className="tabular-nums text-white/50">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
