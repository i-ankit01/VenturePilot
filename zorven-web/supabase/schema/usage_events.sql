create type usage_event_type as enum ('analysis_run', 'report_download');

create table public.usage_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  event_type  usage_event_type not null,
  project_id  uuid references public.projects(id) on delete set null,
  created_at  timestamptz default now()
);