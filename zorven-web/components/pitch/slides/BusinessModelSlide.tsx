
// components/pitch/slides/BusinessModelSlide.tsx

import { BusinessModelSlide as BusinessModelSlideData } from "@/types/pitch";
import { SlideShell, SlideLabel, SlideHeading, NeonDivider, GlassCard, T, SlideNumber } from "../SlideShell";

interface Props { data: BusinessModelSlideData }

export function BusinessModelSlide({ data }: Props) {
  return (
    <SlideShell>
      <div style={{ padding: "32px 48px 0 24px", display: "flex", flexDirection: "column", height: "100%" }}>
        <SlideLabel>Business Model</SlideLabel>
        <div style={{ marginTop: 10, marginBottom: 14 }}>
          <SlideHeading>{data.headline}</SlideHeading>
        </div>
        <NeonDivider />

        <p style={{
          fontFamily: T.fontBody, fontSize: 13, color: T.gray2,
          lineHeight: 1.6, margin: "0 0 22px", maxWidth: 980,
        }}>
          {data.model_description}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, flex: 1 }}>
          {/* Pricing tiers */}
          <div>
            <div style={{
              fontFamily: T.fontBody, fontSize: 10, fontWeight: 700,
              letterSpacing: "0.15em", textTransform: "uppercase",
              color: T.gray2, marginBottom: 12,
            }}>
              Pricing
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.pricing_tiers.map((tier, i) => (
                <GlassCard key={i} accent={i === 1}>
                  <p style={{
                    fontFamily: T.fontBody, fontSize: 13,
                    color: i === 1 ? T.neon : T.gray1,
                    fontWeight: i === 1 ? 600 : 400,
                    margin: 0, lineHeight: 1.5,
                  }}>
                    {tier}
                  </p>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Unit economics */}
          <div>
            <div style={{
              fontFamily: T.fontBody, fontSize: 10, fontWeight: 700,
              letterSpacing: "0.15em", textTransform: "uppercase",
              color: T.gray2, marginBottom: 12,
            }}>
              Unit Economics
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.unit_economics.map((item, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.03)",
                  borderLeft: `2px solid ${T.amber}`,
                  borderRadius: "0 8px 8px 0",
                  padding: "10px 16px",
                }}>
                  <p style={{
                    fontFamily: T.fontHead, fontSize: 14, fontWeight: 600,
                    color: T.amber, margin: 0,
                  }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <SlideNumber n={6} />
    </SlideShell>
  );
}