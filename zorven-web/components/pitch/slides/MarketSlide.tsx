
// components/pitch/slides/MarketSlide.tsx

import { MarketSlide as MarketSlideData } from "@/types/pitch";
import { SlideShell, SlideLabel, SlideHeading, NeonDivider, GlassCard, T, SlideNumber } from "../SlideShell";

interface Props { data: MarketSlideData }

function SizeCard({ tag, value, accent }: { tag: string; value: string; accent?: boolean }) {
  return (
    <GlassCard accent={accent} style={{ height: "100%" }}>
      <div style={{
        fontFamily: T.fontHead, fontSize: 13, fontWeight: 700,
        letterSpacing: "0.1em", color: accent ? T.neon : T.white,
        marginBottom: 10,
      }}>
        {tag}
      </div>
      <p style={{ fontFamily: T.fontBody, fontSize: 12, color: T.gray1, lineHeight: 1.55, margin: 0 }}>
        {value}
      </p>
    </GlassCard>
  );
}

export function MarketSlide({ data }: Props) {
  return (
    <SlideShell>
      <div style={{ padding: "32px 48px 0 24px", display: "flex", flexDirection: "column", height: "100%" }}>
        <SlideLabel>Market Size</SlideLabel>
        <div style={{ marginTop: 10, marginBottom: 18 }}>
          <SlideHeading>{data.headline}</SlideHeading>
        </div>
        <NeonDivider />

        {/* TAM / SAM / SOM */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28, height: 180 }}>
          <SizeCard tag="TAM" value={data.tam} accent />
          <SizeCard tag="SAM" value={data.sam} />
          <SizeCard tag="SOM" value={data.som} />
        </div>

        {/* Tailwinds */}
        <div style={{ marginTop: "auto" }}>
          <div style={{
            fontFamily: T.fontBody, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.15em", textTransform: "uppercase",
            color: T.gray2, marginBottom: 14,
          }}>
            Market Tailwinds
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.market_tailwinds.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: T.amber, flexShrink: 0,
                  boxShadow: `0 0 8px ${T.amber}`,
                }} />
                <span style={{ fontFamily: T.fontBody, fontSize: 13, color: T.gray1 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SlideNumber n={5} />
    </SlideShell>
  );
}