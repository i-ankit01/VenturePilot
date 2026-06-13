
// components/pitch/slides/CompetitionSlide.tsx

import { CompetitionSlide as CompetitionSlideData } from "@/types/pitch";
import { SlideShell, SlideLabel, SlideHeading, NeonDivider, T, SlideNumber } from "../SlideShell";

interface Props { data: CompetitionSlideData }

const COLS = [
  { key: "whatsapp_native", label: "WhatsApp" },
  { key: "gst_compliant", label: "GST" },
  { key: "auto_reminders", label: "Auto-Remind" },
  { key: "freelancer_focused", label: "Freelancer" },
  { key: "affordable_inr", label: "Affordable" },
] as const;

function Mark({ value }: { value: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 22, height: 22, borderRadius: "50%",
      background: value ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.1)",
      color: value ? T.green : T.red,
      fontSize: 13, fontWeight: 700,
    }}>
      {value ? "✓" : "✗"}
    </span>
  );
}

export function CompetitionSlide({ data }: Props) {
  return (
    <SlideShell>
      <div style={{ padding: "32px 48px 0 24px", display: "flex", flexDirection: "column", height: "100%" }}>
        <SlideLabel>Competition</SlideLabel>
        <div style={{ marginTop: 10, marginBottom: 18 }}>
          <SlideHeading size={28}>{data.headline}</SlideHeading>
        </div>
        <NeonDivider />

        <div style={{
          borderRadius: 12,
          border: `1px solid ${T.border}`,
          overflow: "hidden",
          marginBottom: 20,
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                <th style={{
                  textAlign: "left", padding: "10px 18px",
                  fontFamily: T.fontBody, fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase", color: T.gray2,
                }}>
                  Competitor
                </th>
                {COLS.map((c) => (
                  <th key={c.key} style={{
                    textAlign: "center", padding: "10px 8px",
                    fontFamily: T.fontBody, fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase", color: T.gray2,
                  }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.competitor_matrix.map((row, i) => (
                <tr key={i} style={{
                  background: row.is_us ? "rgba(56,189,248,0.08)" : "transparent",
                  borderTop: `1px solid ${T.border}`,
                }}>
                  <td style={{
                    padding: "12px 18px",
                    fontFamily: T.fontHead, fontSize: 13, fontWeight: row.is_us ? 700 : 500,
                    color: row.is_us ? T.neon : T.gray1,
                  }}>
                    {row.is_us ? `★ ${row.competitor_name}` : row.competitor_name}
                  </td>
                  {COLS.map((c) => (
                    <td key={c.key} style={{ textAlign: "center", padding: "12px 8px" }}>
                      <Mark value={row[c.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{
          marginTop: "auto",
          background: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: "14px 20px",
        }}>
          <span style={{ fontFamily: T.fontHead, fontSize: 11, fontWeight: 700, color: T.amber, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Our Moat —{" "}
          </span>
          <span style={{ fontFamily: T.fontBody, fontSize: 13, color: T.gray1 }}>
            {data.our_moat}
          </span>
        </div>
      </div>
      <SlideNumber n={8} />
    </SlideShell>
  );
}