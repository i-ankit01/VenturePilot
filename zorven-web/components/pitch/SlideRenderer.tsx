"use client";
// components/pitch/SlideRenderer.tsx

import { PitchOutput } from "@/types/pitch";
import { CoverSlide } from "./slides/CoverSlide";
import { ProblemSlide } from "./slides/ProblemSlide";
import { SolutionSlide } from "./slides/SolutionSlide";
import { ProductSlide } from "./slides/ProductSlide";
import { MarketSlide } from "./slides/MarketSlide";
import { BusinessModelSlide } from "./slides/BusinessModelSlide";
import { TractionSlide } from "./slides/TractionSlide";
import { CompetitionSlide } from "./slides/CompetitionSlide";
import { GTMSlide } from "./slides/GTMSlide";
import { TeamSlide } from "./slides/TeamSlide";
import { FinancialsSlide } from "./slides/FinancialsSlide";
import { AskSlide } from "./slides/AskSlide";

interface Props {
  data: PitchOutput;
  index: number; // 0-indexed, 0-11
}

export function SlideRenderer({ data, index }: Props) {
  switch (index) {
    case 0: return <CoverSlide data={data.slide_01_cover} />;
    case 1: return <ProblemSlide data={data.slide_02_problem} />;
    case 2: return <SolutionSlide data={data.slide_03_solution} />;
    case 3: return <ProductSlide data={data.slide_04_product} />;
    case 4: return <MarketSlide data={data.slide_05_market} />;
    case 5: return <BusinessModelSlide data={data.slide_06_business} />;
    case 6: return <TractionSlide data={data.slide_07_traction} />;
    case 7: return <CompetitionSlide data={data.slide_08_competition} />;
    case 8: return <GTMSlide data={data.slide_09_gtm} />;
    case 9: return <TeamSlide data={data.slide_10_team} />;
    case 10: return <FinancialsSlide data={data.slide_11_financials} />;
    case 11: return <AskSlide data={data.slide_12_ask} />;
    default: return null;
  }
}

export const SLIDE_COUNT = 12;

export function getSlideTitle(data: PitchOutput, index: number): string {
  const titles = [
    data.slide_01_cover.startup_name,
    "Problem",
    "Solution",
    "Product",
    "Market Size",
    "Business Model",
    "Traction",
    "Competition",
    "Go-To-Market",
    "Team",
    "Financials",
    "The Ask",
  ];
  return titles[index] ?? `Slide ${index + 1}`;
}