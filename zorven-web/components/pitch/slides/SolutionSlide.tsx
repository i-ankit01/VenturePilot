
// components/pitch/slides/SolutionSlide.tsx

import { SolutionSlide as SolutionSlideData } from "@/types/pitch";
import { SlideShell, SlideLabel, SlideHeading, NeonDivider, BulletRow, GlassCard, T, SlideNumber } from "../SlideShell";

interface Props { data: SolutionSlideData }

export function SolutionSlide({ data }: Props) {
  return (
    <SlideShell>
      <div style={{ padding: "32px 48px 0 24px", display: "flex", flexDirection: "column", height: "100%" }}>
        <SlideLabel>The Solution</SlideLabel>
        <div style={{ marginTop: 10, marginBottom: 18 }}>
          <SlideHeading>{data.headline}</SlideHeading>
        </div>
        <NeonDivider />

        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginBottom: 28 }}>
          {data.solution_bullets.map((p, i) => (
            <BulletRow key={i} headline={p.headline} supporting={p.supporting} />
          ))}
        </div>

        <div style={{ marginTop: "auto" }}>
          <GlassCard accent style={{ background: "rgba(56,189,248,0.08)" }}>
            <p style={{
              fontFamily: T.fontHead,
              fontSize: 15,
              fontWeight: 600,
              color: T.neon,
              fontStyle: "italic",
              margin: 0,
              lineHeight: 1.5,
            }}>
              {data.aha_moment}
            </p>
          </GlassCard>
        </div>
      </div>
      <SlideNumber n={3} />
    </SlideShell>
  );
}