-- ─────────────────────────────────────────────────────────────────────────────
-- VenturePilot — Jobs table (replaces in-memory dict)
-- Run this in your Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Jobs table
create table if not exists public.jobs (
  id                   uuid primary key default gen_random_uuid(),
  project_id           uuid references public.projects(id) on delete cascade,

  -- Pipeline lifecycle
  status               text not null default 'pending'
                         check (status in (
                           'pending',
                           'running',
                           'awaiting_branding_approval',
                           'branding_approved',
                           'done',
                           'error'
                         )),

  -- Live agent outputs (streamed in as each agent finishes)
  partial              jsonb not null default '{}'::jsonb,

  -- Branding HITL columns (kept separate from partial for clarity)
  branding_suggestions jsonb,   -- what the AI generated (shown to founder)
  approved_branding    jsonb,   -- what the founder approved/edited

  -- Logo
  logo_image_url       text,    -- public URL from Supabase Storage

  -- Report download
  report_path          text,

  -- Tracking
  completed_agents     jsonb not null default '[]'::jsonb,
  errors               jsonb not null default '[]'::jsonb,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- 2. Auto-update updated_at
create or replace function public.handle_jobs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists jobs_updated_at on public.jobs;
create trigger jobs_updated_at
  before update on public.jobs
  for each row execute procedure public.handle_jobs_updated_at();

-- 3. RLS — service role bypasses; anon/authenticated can read their own jobs
--    via the project_id → projects.user_id chain
alter table public.jobs enable row level security;

create policy "Users can read jobs for their projects"
  on public.jobs for select
  using (
    project_id in (
      select id from public.projects where user_id = auth.uid()
    )
  );

-- Service role key (used by Python backend) bypasses RLS automatically.

-- 4. Index for fast lookup by project_id
create index if not exists jobs_project_id_idx on public.jobs(project_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage bucket for logo images
-- ─────────────────────────────────────────────────────────────────────────────

-- Run this in Supabase dashboard → Storage → New bucket
-- OR via SQL (storage schema must exist, which it does by default):

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Policy: anyone can read (logos are public)
create policy "Logos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'logos');

-- Policy: service role can insert (Python backend uploads)
create policy "Service role can upload logos"
  on storage.objects for insert
  with check (bucket_id = 'logos');