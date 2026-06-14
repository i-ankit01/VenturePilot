create table public.google_credentials (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references public.profiles(id) on delete cascade,
  access_token  text not null,
  refresh_token text not null,
  token_expiry  timestamptz,
  scopes        text[] not null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- alter table public.investors
--   add column reply_sentiment text;  -- optional, from the reply-drafting agent