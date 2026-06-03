# Agent Workflow

## Folder Structure for the agent
venture-pilot/
│
├── agents/
│   ├── planner.py        ✅ keep — orchestrates the whole run
│   ├── research.py       ✅ keep — BASE agent, runs first
│   ├── competitor.py     ✅ keep — feeds from research
│   ├── branding.py       ✅ keep — name, tagline, positioning
│   ├── product.py        ✅ keep — MVP scope, features, roadmap
│   ├── finance.py        ✅ keep — revenue model, projections
│   ├── gtm.py            ✅ keep — marketing, growth, scaling tips
│   ├── pitch.py          ➕ ADD — generates pitch deck narrative + slides outline
│   └── report.py         ➕ ADD — assembles everything into final PPT/PDF
│
├── schemas/
│   ├── research.py
│   ├── competitor.py     ➕ ADD
│   ├── branding.py
│   ├── product.py        ➕ ADD
│   ├── finance.py
│   ├── gtm.py            ➕ ADD
│   └── pitch.py          ➕ ADD
│
├── graph/
│   └── workflow.py       — LangGraph StateGraph wired here
│
├── prompts/
│   └── *.py or *.md      — one prompt file per agent
│
├── tools/
│   └── web_search.py     ➕ ADD — Tavily/Serper for research + competitor agents
│
├── state.py              — shared AppState TypedDict
└── main.py

## Agent Flow & Dependencies
[User Input: idea, industry, target market, budget]
            │
            ▼
      1. PLANNER
    (breaks down the idea, sets scope)
            │
            ▼
      2. RESEARCH          ← Web search tool here
    (market size, trends, TAM/SAM/SOM, problem validation)
            │
       ┌────┴─────┐
       ▼          ▼
  3. COMPETITOR   4. PRODUCT
  (who exists,   (MVP features,
   gaps, moat)    tech stack, roadmap)
       │          │
       └────┬─────┘
            ▼
       5. BRANDING
    (name ideas, tagline, ICP,
     positioning vs competitors)
            │
       ┌────┴─────┐
       ▼          ▼
   6. FINANCE    7. GTM
  (pricing,      (channels, growth hacks,
   projections,   small→large scale tips)
   burn rate)
       │          │
       └────┬─────┘
            ▼
        8. PITCH
    (slide-by-slide narrative,
     investor story, hook)
            │
            ▼
        9. REPORT
    (final PPT + PDF assembly)