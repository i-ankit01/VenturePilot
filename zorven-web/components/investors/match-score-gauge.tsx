import { getScoreColor } from "@/lib/investors/utils";

const MONO = { fontFamily: "'DM Mono', monospace" };

interface MatchScoreGaugeProps {
  score: number;
  size?: number;
}

export function MatchScoreGauge({ score, size = 72 }: MatchScoreGaugeProps) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = getScoreColor(score);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* Fill arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.7s ease-out",
            filter: `drop-shadow(0 0 5px ${color}90)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-[15px] font-bold tabular-nums leading-none" style={{ ...MONO, color }}>
          {score}
        </span>
        <span className="text-[8px] uppercase tracking-widest text-white/25" style={MONO}>
          match
        </span>
      </div>
    </div>
  );
}