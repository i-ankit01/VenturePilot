const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PipelineStatus = "idle" | "running" | "done" | "error";

export interface PartialResult {
  // Planner
  planner_output?: {
    startup_name: string;
    one_liner: string;
    problem: string;
    solution: string;
    target_market: string;
    industry: string;
    stage: string;
  };
  // Research
  research_output?: {
    market_size: string;
    market_growth: string;
    key_trends: string[];
    target_segments: string[];
    market_summary: string;
  };
  // Competitor
  competitor_output?: {
    competitors: {
      name: string;
      description: string;
      strengths: string[];
      weaknesses: string[];
      pricing: string;
    }[];
    competitive_advantage: string;
  };
  // Product
  product_output?: {
    core_features: { name: string; description: string; priority: string }[];
    pricing_tiers: { name: string; price: string; features: string[] }[];
    roadmap: { phase: string; duration: string; features: string[] }[];
  };
  // Branding
  branding_output?: {
    brand_name: string;
    taglines: string[];
    domain_suggestions: string[];
    color_palette: { name: string; hex: string; psychology: string }[];
    typography: { heading: string; body: string };
    icp_story: string;
    logo_direction: string;
    brand_dos: string[];
    brand_donts: string[];
  };
  // Finance
  finance_output?: {
    monthly_projections: { month: number; mrr: number; customers: number; expenses: number }[];
    arr_year1: number;
    ltv: number;
    cac: number;
    payback_months: number;
    runway_months: number;
    fundraising_recommendation: string;
  };
  // GTM
  gtm_output?: {
    first_100_users: string[];
    weekly_plan: {
      week: number;
      phase: string;
      milestone: string;
      milestone_label: string;
      channel_focus: string;
    }[];
    growth_experiments: string[];
    scaling_strategy: { stage: string; users: string; tactics: string[] }[];
  };
  // Pitch
  pitch_output?: {
    slides: { title: string; content: string; presenter_notes: string }[];
    competitor_matrix: { feature: string; us: boolean; competitors: Record<string, boolean> }[];
    financial_snapshot: string;
    investor_qas: { question: string; answer: string }[];
    follow_up_email: string;
  };
}

export interface PartialResponse {
  status: PipelineStatus;
  partial: PartialResult;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export interface PitchRequest {
  idea: string;
  industry: string;
  target_market: string;
  budget?: string;  // default "bootstrapped"
  stage?: string;   // default "idea"
}

export async function startPipeline(payload: PitchRequest): Promise<{ job_id: string }> {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      budget: "bootstrapped",
      stage: "idea",
      ...payload,
    }),
  });
  if (!res.ok) throw new Error(`Failed to start pipeline: ${res.statusText}`);
  return res.json();
}

export async function fetchPartial(jobId: string): Promise<PartialResponse> {
  const res = await fetch(`${API_URL}/api/partial/${jobId}`);
  if (!res.ok) throw new Error(`Failed to fetch partial: ${res.statusText}`);
  return res.json();
}