-- ============================================
-- 1. investor_messages — the actual "memory": every email in/out, not last-write-wins
-- ============================================
create table public.investor_messages (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  investor_id       uuid not null references public.investors(id) on delete cascade,

  direction         text not null check (direction in ('outbound', 'inbound')),
  is_draft          boolean not null default false,   -- true until actually sent (replaces old draft columns)

  subject           text,
  body              text not null,

  gmail_message_id  text,
  gmail_thread_id   text,

  sentiment         text check (sentiment in ('positive', 'neutral', 'negative', 'needs_info')),
  drafted_by        text not null default 'agent' check (drafted_by in ('agent', 'human')),

  -- structured extraction off an inbound reply, if the investor proposed a time
  proposed_start    timestamptz,
  proposed_end      timestamptz,

  sent_at           timestamptz,        -- null while is_draft = true
  created_at        timestamptz not null default now(),

  unique (gmail_message_id)
);

create index idx_investor_messages_investor_id on public.investor_messages(investor_id, sent_at);
create index idx_investor_messages_project_id on public.investor_messages(project_id);

-- ============================================
-- 2. meetings — one row per call, supports reschedules / multiple meetings per investor
-- ============================================
create table public.meetings (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  investor_id       uuid not null references public.investors(id) on delete cascade,
  source_message_id uuid references public.investor_messages(id) on delete set null,  -- which reply triggered this

  google_event_id   text,
  meet_link         text,
  start_time        timestamptz not null,
  end_time          timestamptz not null,
  timezone          text not null default 'Asia/Kolkata',
  status            text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'completed', 'rescheduled')),
  scheduled_via     text not null default 'agent' check (scheduled_via in ('agent', 'human')),

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_meetings_investor_id on public.meetings(investor_id);

-- ============================================
-- 3. investors — drop everything now owned by the two tables above
-- ============================================
alter table public.investors
  drop column if exists email_subject,
  drop column if exists email_body,
  drop column if exists email_sent,
  drop column if exists email_sent_at,
  drop column if exists reply_received,
  drop column if exists reply_received_at,
  drop column if exists reply_draft,
  drop column if exists reply_sent,
  drop column if exists reply_sentiment,
  drop column if exists meeting_scheduled,
  drop column if exists meet_link,
  drop column if exists meeting_time;
-- gmail_thread_id stays — one thread per investor is still a fine assumption

-- ============================================
-- 4. dashboard convenience view — so your frontend list query doesn't need 3 joins
-- ============================================
create or replace view public.investor_overview as
select
  i.*,
  exists (select 1 from public.investor_messages m
          where m.investor_id = i.id and m.direction = 'outbound' and not m.is_draft) as email_sent,
  (select max(sent_at) from public.investor_messages m
   where m.investor_id = i.id and m.direction = 'outbound') as last_outbound_at,
  (select max(sent_at) from public.investor_messages m
   where m.investor_id = i.id and m.direction = 'inbound') as last_inbound_at,
  (select sentiment from public.investor_messages m
   where m.investor_id = i.id and m.direction = 'inbound'
   order by sent_at desc limit 1) as last_reply_sentiment,
  exists (select 1 from public.meetings mt
          where mt.investor_id = i.id and mt.status = 'scheduled') as meeting_scheduled,
  (select meet_link from public.meetings mt
   where mt.investor_id = i.id and mt.status = 'scheduled'
   order by start_time desc limit 1) as upcoming_meet_link,
  (select start_time from public.meetings mt
   where mt.investor_id = i.id and mt.status = 'scheduled'
   order by start_time desc limit 1) as upcoming_meeting_time
from public.investors i;