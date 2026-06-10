create type agent_name as enum (
  'planner', 'research', 'competitor', 'product',
  'branding', 'finance', 'gtm', 'pitch'
);

create table public.analysis_results (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  agent       agent_name not null,
  output      jsonb,                    -- the Pydantic model output as JSON
  completed_at timestamptz default now(),
  unique (project_id, agent)            -- one result per agent per project
);