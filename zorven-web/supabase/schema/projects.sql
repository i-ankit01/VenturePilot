create type project_status as enum ('pending', 'building', 'completed', 'error');

create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null,                      -- derived from the idea, or user-set
  idea         text not null,
  industry     text,
  target_market text,
  budget       text,
  stage        text,
  status       project_status default 'pending',
  job_id       text,                               -- LangGraph/backend job ID for polling
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);