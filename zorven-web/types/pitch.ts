// types/pitch.ts
// Mirrors schemas/pitch.py exactly — keep in sync with the Python Pydantic models

export interface BulletPoint {
  headline: string;
  supporting: string;
}

export interface CompetitorMatrixRow {
  competitor_name: string;
  whatsapp_native: boolean;
  gst_compliant: boolean;
  auto_reminders: boolean;
  freelancer_focused: boolean;
  affordable_inr: boolean;
  is_us: boolean;
}

export interface FinancialSnapshot {
  arr_month_12: string;
  mrr_month_12: string;
  paid_users_month_12: string;
  break_even_month: string;
  ltv_cac: string;
  gross_margin: string;
  runway: string;
  raise_amount: string;
}

export interface CoverSlide {
  slide_number: number;
  slide_type: string;
  startup_name: string;
  tagline: string;
  one_liner: string;
  presenter_note: string;
}

export interface ProblemSlide {
  slide_number: number;
  slide_type: string;
  headline: string;
  pain_points: BulletPoint[];
  emotional_hook: string;
  presenter_note: string;
}

export interface SolutionSlide {
  slide_number: number;
  slide_type: string;
  headline: string;
  solution_bullets: BulletPoint[];
  aha_moment: string;
  presenter_note: string;
}

export interface ProductSlide {
  slide_number: number;
  slide_type: string;
  headline: string;
  core_features: string[];
  demo_flow: string;
  tech_differentiator: string;
  presenter_note: string;
}

export interface MarketSlide {
  slide_number: number;
  slide_type: string;
  headline: string;
  tam: string;
  sam: string;
  som: string;
  market_tailwinds: string[];
  presenter_note: string;
}

export interface BusinessModelSlide {
  slide_number: number;
  slide_type: string;
  headline: string;
  model_description: string;
  pricing_tiers: string[];
  unit_economics: string[];
  presenter_note: string;
}

export interface TractionSlide {
  slide_number: number;
  slide_type: string;
  headline: string;
  traction_points: BulletPoint[];
  validation_quote: string;
  next_milestones: string[];
  presenter_note: string;
}

export interface CompetitionSlide {
  slide_number: number;
  slide_type: string;
  headline: string;
  competitor_matrix: CompetitorMatrixRow[];
  our_moat: string;
  presenter_note: string;
}

export interface GTMSlide {
  slide_number: number;
  slide_type: string;
  headline: string;
  phase_1: string;
  phase_2: string;
  phase_3: string;
  primary_channels: string[];
  north_star: string;
  presenter_note: string;
}

export interface TeamSlide {
  slide_number: number;
  slide_type: string;
  headline: string;
  why_us: string;
  key_hires_needed: string[];
  advisors_or_supporters: string;
  presenter_note: string;
}

export interface FinancialsSlide {
  slide_number: number;
  slide_type: string;
  headline: string;
  snapshot: FinancialSnapshot;
  projection_narrative: string;
  key_assumptions: string[];
  presenter_note: string;
}

export interface AskSlide {
  slide_number: number;
  slide_type: string;
  headline: string;
  raise_amount: string;
  use_of_funds: string[];
  milestones_unlocked: string[];
  closing_line: string;
  presenter_note: string;
}

export interface PitchOutput {
  deck_title: string;
  total_slides: number;
  recommended_duration: string;
  pitch_narrative_summary: string;
  slide_01_cover: CoverSlide;
  slide_02_problem: ProblemSlide;
  slide_03_solution: SolutionSlide;
  slide_04_product: ProductSlide;
  slide_05_market: MarketSlide;
  slide_06_business: BusinessModelSlide;
  slide_07_traction: TractionSlide;
  slide_08_competition: CompetitionSlide;
  slide_09_gtm: GTMSlide;
  slide_10_team: TeamSlide;
  slide_11_financials: FinancialsSlide;
  slide_12_ask: AskSlide;
  hardest_questions: string[];
  email_follow_up: string;
}