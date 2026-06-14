interface ScoreBreakdownBarsProps {
  sectorFit: number;
  stageFit: number;
  thesisAlignment: number;
}

export function ScoreBreakdownBars({
  sectorFit,
  stageFit,
  thesisAlignment,
}: ScoreBreakdownBarsProps) {
  const rows = [
    { label: "Sector", value: sectorFit },
    { label: "Stage", value: stageFit },
    { label: "Thesis", value: thesisAlignment },
  ];

  return (
    <div className="space-y-1.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2 text-xs">
          <span className="w-12 shrink-0 font-mono uppercase tracking-wider text-muted-foreground">
            {row.label}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${row.value}%` }} />
          </div>
          <span className="w-7 shrink-0 text-right font-mono tabular-nums text-muted-foreground">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}