-- Run once in your own Supabase project's SQL editor. No privileged key is used by the website.
create table if not exists public.study_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  event_key text not null check (length(event_key) between 1 and 200),
  event_value jsonb not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.study_events enable row level security;
drop policy if exists "Read own study events" on public.study_events;
create policy "Read own study events" on public.study_events for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Insert own study events" on public.study_events;
create policy "Insert own study events" on public.study_events for insert to authenticated with check ((select auth.uid()) = user_id);
-- Events are append-only: no UPDATE policy, no DELETE policy.
revoke all on public.study_events from anon;
revoke all on public.study_events from authenticated;
grant select, insert on public.study_events to authenticated;
