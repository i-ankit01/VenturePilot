create table public.report_downloads (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  storage_path text,                    -- Supabase Storage path to the .pptx file
  downloaded_at timestamptz default now()
);