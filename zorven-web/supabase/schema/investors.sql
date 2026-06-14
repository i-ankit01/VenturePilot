create table public.investors (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,

  -- profile (from search step)
  name            text,
  firm            text,
  title           text,
  email           text,
  focus_areas     text[],
  investment_stages text[],
  bio             text,
  source_url      text,

  -- scoring (from agent)
  overall_score   int,
  sector_fit      int,
  stage_fit       int,
  thesis_alignment int,
  reasoning       text[],
  relevant_signal text,

  -- outreach lifecycle
  email_subject  text,
  email_body     text,
  email_sent      boolean default false,
  email_sent_at   timestamptz,
  gmail_thread_id text,

  reply_received  text,
  reply_received_at timestamptz,
  reply_draft     text,
  reply_sent      boolean default false,

  meeting_scheduled boolean default false,
  meet_link       text,
  meeting_time    timestamptz,

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);