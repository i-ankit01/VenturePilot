
// components/pitch/slides/ProblemSlide.tsx

import { ProblemSlide as ProblemSlideData } from "@/types/pitch";
import { SlideShell, SlideLabel, SlideHeading, NeonDivider, BulletRow, GlassCard, T, SlideNumber } from "../SlideShell";

interface Props { data: ProblemSlideData }

export function ProblemSlide({ data }: Props) {
  return (
    <SlideShell>
      <div style={{ padding: "32px 48px 0 24px", display: "flex", flexDirection: "column", height: "100%" }}>
        <SlideLabel>The Problem</SlideLabel>
        <div style={{ marginTop: 10, marginBottom: 18 }}>
          <SlideHeading>{data.headline}</SlideHeading>
        </div>
        <NeonDivider />

        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginBottom: 28 }}>
          {data.pain_points.map((p, i) => (
            <BulletRow key={i} headline={p.headline} supporting={p.supporting} />
          ))}
        </div>

        <div style={{ marginTop: "auto" }}>
          <GlassCard accent>
            <p style={{
              fontFamily: T.fontHead,
              fontSize: 15,
              fontWeight: 600,
              color: T.white,
              fontStyle: "italic",
              margin: 0,
              lineHeight: 1.5,
            }}>
              {data.emotional_hook}
            </p>
          </GlassCard>
        </div>
      </div>
      <SlideNumber n={2} />
    </SlideShell>
  );
}