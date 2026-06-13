// app/api/pitch/export/route.tsx
import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { renderToStaticMarkup } from "react-dom/server";
import { PitchOutput } from "@/types/pitch";
import { CoverSlide } from "@/components/pitch/slides/CoverSlide";
import { ProblemSlide } from "@/components/pitch/slides/ProblemSlide";
import { SolutionSlide } from "@/components/pitch/slides/SolutionSlide";
import { ProductSlide } from "@/components/pitch/slides/ProductSlide";
import { MarketSlide } from "@/components/pitch/slides/MarketSlide";
import { BusinessModelSlide } from "@/components/pitch/slides/BusinessModelSlide";
import { TractionSlide } from "@/components/pitch/slides/TractionSlide";
import { CompetitionSlide } from "@/components/pitch/slides/CompetitionSlide";
import { GTMSlide } from "@/components/pitch/slides/GTMSlide";
import { TeamSlide } from "@/components/pitch/slides/TeamSlide";
import { FinancialsSlide } from "@/components/pitch/slides/FinancialsSlide";
import { AskSlide } from "@/components/pitch/slides/AskSlide";


function renderSlideHTML(data: PitchOutput): string {
  const slides = [
    <CoverSlide key={0} data={data.slide_01_cover} />,
    <ProblemSlide key={1} data={data.slide_02_problem} />,
    <SolutionSlide key={2} data={data.slide_03_solution} />,
    <ProductSlide key={3} data={data.slide_04_product} />,
    <MarketSlide key={4} data={data.slide_05_market} />,
    <BusinessModelSlide key={5} data={data.slide_06_business} />,
    <TractionSlide key={6} data={data.slide_07_traction} />,
    <CompetitionSlide key={7} data={data.slide_08_competition} />,
    <GTMSlide key={8} data={data.slide_09_gtm} />,
    <TeamSlide key={9} data={data.slide_10_team} />,
    <FinancialsSlide key={10} data={data.slide_11_financials} />,
    <AskSlide key={11} data={data.slide_12_ask} />,
  ];

  const slidesHTML = slides
    .map((slide) => `<div class="pdf-slide">${renderToStaticMarkup(slide)}</div>`)
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: 1280px 720px; margin: 0; }
    body { background: #050507; }
    .pdf-slide {
      width: 1280px;
      height: 720px;
      overflow: hidden;
      page-break-after: always;
    }
    .pdf-slide:last-child { page-break-after: avoid; }
  </style>
</head>
<body>
  ${slidesHTML}
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pitchOutput: PitchOutput | undefined = body?.pitch_output;

  if (!pitchOutput) {
    return NextResponse.json({ error: "Missing pitch_output in request body" }, { status: 400 });
  }

  const html = renderSlideHTML(pitchOutput);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
    });
    await page.setContent(html, { waitUntil: "networkidle" });

    // Wait for fonts to load before printing
    await page.evaluate(() => document.fonts.ready);

    const pdfBuffer = await page.pdf({
      width: "1280px",
      height: "720px",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });

    const filename = `${pitchOutput.deck_title.replace(/\s+/g, "_").toLowerCase()}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } finally {
    await browser.close();
  }
}