
// components/pitch/slides/ProductSlide.tsx

import { ProductSlide as ProductSlideData } from "@/types/pitch";
import { SlideShell, SlideLabel, SlideHeading, NeonDivider, GlassCard, T, SlideNumber } from "../SlideShell";

interface Props { data: ProductSlideData }

export function ProductSlide({ data }: Props) {
  return (
    <SlideShell>
      <div style={{ padding: "32px 48px 0 24px", display: "flex", flexDirection: "column", height: "100%" }}>
        <SlideLabel>Product</SlideLabel>
        <div style={{ marginTop: 10, marginBottom: 18 }}>
          <SlideHeading>{data.headline}</SlideHeading>
        </div>
        <NeonDivider />

        {/* 2x2 feature grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 14,
          flex: 1,
          marginBottom: 16,
        }}>
          {data.core_features.map((feat, i) => (
            <GlassCard
              key={i}
              accent={i % 2 === 0}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "18px 22px",
              }}
            >
              <p style={{
                fontFamily: T.fontHead,
                fontSize: 15,
                fontWeight: 600,
                color: T.white,
                margin: 0,
                lineHeight: 1.4,
              }}>
                {feat}
              </p>
            </GlassCard>
          ))}
        </div>

        {/* Demo flow + tech differentiator */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          <div style={{
            background: T.neonDim,
            border: `1px solid ${T.borderAccent}`,
            borderRadius: 12,
            padding: "12px 18px",
          }}>
            <div style={{
              fontFamily: T.fontBody, fontSize: 10, fontWeight: 700,
              letterSpacing: "0.15em", textTransform: "uppercase",
              color: T.neon, opacity: 0.8, marginBottom: 4,
            }}>
              Demo Flow
            </div>
            <p style={{ fontFamily: T.fontBody, fontSize: 13, color: T.gray1, margin: 0, lineHeight: 1.5 }}>
              {data.demo_flow}
            </p>
          </div>
          <p style={{
            fontFamily: T.fontBody, fontSize: 12, color: T.gray3,
            margin: 0, fontStyle: "italic",
          }}>
            {data.tech_differentiator}
          </p>
        </div>
      </div>
      <SlideNumber n={4} />
    </SlideShell>
  );
}