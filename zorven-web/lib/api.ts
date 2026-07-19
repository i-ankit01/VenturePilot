const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PipelineStatus = "idle" | "running" | "awaiting_branding_approval" | "done" | "error";

export interface PartialResult {
  // Planner
  planner_output?: {
    refined_idea: string;
    industry: string;
    target_market: string;
    startup_type: string;
    stage: string;
    budget: string;
    one_liner: string;
    core_problem: string;
    unique_angle: string;
    geography: string;
    agents_to_run: string[];
  };
  // Research
  research_output?: {
    market_size: string;
    problem_statement: string;
    target_audience: string;
    market_trends: string[];
    pain_points: string[];
    opportunity_gap: string;
    key_assumptions: string[];
    sources: string[];
  };
  // Competitor
  competitor_output?: {
    competitors: {
      name: string;
      description: string;
      strengths: string[];
      weaknesses: string[];
      pricing: string;
      target_segment: string;
    }[];
    market_leader: string;
    pricing_landscape: string;
    feature_gaps: string[];
    underserved_segments: string[];
    suggested_differentiators: string[];
    sources: string[];
  };
  // Product
  product_output?: {
    product_name_suggestion: string;
    usp: string;
    mvp_scope: string;
    core_features: { name: string; description: string; priority: string; solves_pain: string }[];
    suggested_tech_stack: string[];
    monetization_model: string;
    pricing_recommendation: string;
    roadmap: { phase: string; timeline: string; deliverables: string[] }[];
    product_risks: string[];
  };
  // Branding
  branding_output?: {
    name_suggestions: { name: string; rationale: string; domain_available: string; tagline_fit: string }[];
    recommended_name: string;
    taglines: string[];
    recommended_tagline: string;
    brand_personality: string;
    brand_tone: string;
    brand_voice_description: string;
    positioning_statement: string;
    elevator_pitch: string;
    messaging_pillars: string[];
    color_palette: { role: string; hex_code: string; color_name: string; usage: string; psychology: string }[];
    color_palette_rationale: string;
    typography: { role: string; font_name: string; source: string; why: string }[];
    domain_suggestions: { domain: string; rationale: string }[];
    icp_summary: string;
    logo_direction: string;
    brand_dos: string[];
    brand_donts: string[];
  };
  // Finance
  finance_output?: {
    pricing_tiers: {
      name: string;
      price_monthly: number;
      price_annually: number;
      currency: string;
      features_included: string[];
      target_user: string;
      conversion_assumption: string;
    }[];
    pricing_strategy_rationale: string;
    monthly_projections: {
      month: number;
      users_free: number;
      users_paid: number;
      mrr: number;
      revenue: number;
      expenses: number;
      net_cashflow: number;
      cumulative_cash: number;
    }[];
    saas_metrics: {
      arr: number;
      mrr_month_12: number;
      mrr_month_1: number;
      mrr_growth_rate: string;
      churn_rate_assumed: string;
      ltv: number;
      cac: number;
      ltv_cac_ratio: string;
      payback_period_months: number;
      gross_margin: string;
      arpu: number;
      nps_target: string;
    };
    runway: {
      initial_capital: number;
      monthly_burn_rate: number;
      break_even_month: number;
      runway_months: number;
      runway_with_revenue_months: number;
      cash_at_month_12: number;
      burn_rate_breakdown: string[];
    };
    scenarios: { scenario: string; assumption: string; paid_users_month_12: number; mrr_month_12: number; arr_month_12: number; profitable: boolean }[];
    financial_risks: string[];
    cfo_advice: string[];
    currency: string;
    financial_model_assumptions: string[];
  };
  // GTM
  gtm_output?: {
    first_100_users: {
      total_timeline: string;
      core_approach: string;
      steps: string[];
      where_to_find_them: string[];
      hook_offer: string;
      conversion_script: string;
    };
    channels: {
      channel: string;
      priority: string;
      why_this_channel: string;
      tactics: string[];
      estimated_cac: string;
      kpi: string;
      when_to_start: string;
    }[];
    weekly_plan: {
      week: number;
      theme: string;
      phase: string;
      goals: string[];
      tasks: string[];
      channel_focus: string[];
      success_metric: string;
      milestone: boolean;
      milestone_label: string;
    }[];
    growth_experiments: {
      name: string;
      hypothesis: string;
      how_to_run: string;
      success_criteria: string;
      effort: string;
      potential_impact: string;
      timeline: string;
    }[];
    scaling_strategy: {
      phase: string;
      timeframe: string;
      primary_engine: string;
      key_actions: string[];
      budget_allocation: string;
      unlock_condition: string;
    }[];
    content_strategy: string;
    retention_strategy: string;
    referral_strategy: string;
    partnership_opportunities: string[];
    north_star_metric: string;
    gtm_risks: string[];
  };
  // Pitch
  pitch_output?: {
    deck_title: string;
    total_slides: number;
    recommended_duration: string;
    pitch_narrative_summary: string;
    slide_01_cover: { slide_number?: number; slide_type?: string; startup_name: string; tagline: string; one_liner: string; presenter_note: string };
    slide_02_problem: { slide_number?: number; slide_type?: string; headline: string; pain_points: { headline: string; supporting: string }[]; emotional_hook: string; presenter_note: string };
    slide_03_solution: { slide_number?: number; slide_type?: string; headline: string; solution_bullets: { headline: string; supporting: string }[]; aha_moment: string; presenter_note: string };
    slide_04_product: { slide_number?: number; slide_type?: string; headline: string; core_features: string[]; demo_flow: string; tech_differentiator: string; presenter_note: string };
    slide_05_market: { slide_number?: number; slide_type?: string; headline: string; tam: string; sam: string; som: string; market_tailwinds: string[]; presenter_note: string };
    slide_06_business: { slide_number?: number; slide_type?: string; headline: string; model_description: string; pricing_tiers: string[]; unit_economics: string[]; presenter_note: string };
    slide_07_traction: { slide_number?: number; slide_type?: string; headline: string; traction_points: { headline: string; supporting: string }[]; validation_quote: string; next_milestones: string[]; presenter_note: string };
    slide_08_competition: { slide_number?: number; slide_type?: string; headline: string; competitor_matrix: { competitor_name: string; whatsapp_native: boolean; gst_compliant: boolean; auto_reminders: boolean; freelancer_focused: boolean; affordable_inr: boolean; is_us: boolean }[]; our_moat: string; presenter_note: string };
    slide_09_gtm: { slide_number?: number; slide_type?: string; headline: string; phase_1: string; phase_2: string; phase_3: string; primary_channels: string[]; north_star: string; presenter_note: string };
    slide_10_team: { slide_number?: number; slide_type?: string; headline: string; why_us: string; key_hires_needed: string[]; advisors_or_supporters: string; presenter_note: string };
    slide_11_financials: {  slide_number?: number; slide_type?: string; headline: string; snapshot: { arr_month_12: string; mrr_month_12: string; paid_users_month_12: string; break_even_month: string; ltv_cac: string; gross_margin: string; runway: string; raise_amount: string }; projection_narrative: string; key_assumptions: string[]; presenter_note: string };
    slide_12_ask: { slide_number?: number; slide_type?: string; headline: string; raise_amount: string; use_of_funds: string[]; milestones_unlocked: string[]; closing_line: string; presenter_note: string };
    hardest_questions: string[];
    email_follow_up: string;
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

// ── new types for the branding review payload ───────────────────────────
export interface BrandingApprovals {
  recommended_name: boolean;
  recommended_tagline: boolean;
  color_palette: boolean;
}

export interface BrandingReview {
  branding_output: NonNullable<PartialResult["branding_output"]>;
  approvals: BrandingApprovals;
  instruction: string;
}

export interface BrandingReviewAction {
  section: "recommended_name" | "recommended_tagline" | "color_palette";
  action: "approve" | "edit" | "regenerate";
  value?: string | NonNullable<PartialResult["branding_output"]>["color_palette"];
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

// ── new API calls ────────────────────────────────────────────────────────
export async function fetchBrandingReview(
  jobId: string
): Promise<
  | { status: "awaiting_branding_approval"; review: BrandingReview }
  | { status: PipelineStatus }
> {
  const res = await fetch(`${API_URL}/api/branding-review/${jobId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch branding review: ${res.statusText}`);
  }
  return res.json();
}

export async function submitBrandingAction(jobId: string, action: BrandingReviewAction): Promise<{ job_id: string; status: string } | { error: string }> {
  const res = await fetch(`${API_URL}/api/resume/${jobId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  });
  if (!res.ok) throw new Error(`Failed to submit branding action: ${res.statusText}`);
  return res.json();
}