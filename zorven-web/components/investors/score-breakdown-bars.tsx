const MONO = { fontFamily: "'DM Mono', monospace" };

interface ScoreBreakdownBarsProps {
  sectorFit: number;
  stageFit: number;
  thesisAlignment: number;
}

export function ScoreBreakdownBars({ sectorFit, stageFit, thesisAlignment }: ScoreBreakdownBarsProps) {
  const rows = [
    { label: "Sector", value: sectorFit },
    { label: "Stage",  value: stageFit },
    { label: "Thesis", value: thesisAlignment },
  ];

  return (
    <div className="space-y-2.5">
      {rows.map((row) => {
        const hue = row.value >= 75 ? "emerald" : row.value >= 50 ? "blue" : "amber";
        const barColor =
          hue === "emerald" ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
          : hue === "blue"  ? "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]"
          :                   "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]";
        const valueColor =
          hue === "emerald" ? "text-emerald-300"
          : hue === "blue"  ? "text-blue-300"
          :                   "text-amber-300";

        return (
          <div key={row.label} className="flex items-center gap-3">
            <span className="w-11 shrink-0 text-[10px] uppercase tracking-wider text-white/30" style={MONO}>
              {row.label}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${row.value}%` }}
              />
            </div>
            <span className={`w-7 shrink-0 text-right text-[11px] tabular-nums font-semibold ${valueColor}`} style={MONO}>
              {row.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}