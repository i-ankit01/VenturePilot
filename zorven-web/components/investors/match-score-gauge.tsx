import { getScoreColor } from "@/lib/investors/utils";

interface MatchScoreGaugeProps {
  score: number;
  size?: number;
}

export function MatchScoreGauge({ score, size = 64 }: MatchScoreGaugeProps) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = getScoreColor(score);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-sm font-semibold leading-none" style={{ color }}>
          {score}
        </span>
        <span className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          match
        </span>
      </div>
    </div>
  );
}