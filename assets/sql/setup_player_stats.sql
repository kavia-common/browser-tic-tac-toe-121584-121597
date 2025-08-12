-- Player stats setup for Tic Tac Toe
-- Run this in Supabase SQL editor.

-- 1) Table
create table if not exists public.player_stats (
  name text primary key,
  wins bigint not null default 0,
  draws bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- 2) Updated-at trigger
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists set_player_stats_updated_at on public.player_stats;
create trigger set_player_stats_updated_at
before update on public.player_stats
for each row execute procedure public.set_updated_at();

-- 3) RLS Options
-- Option A (default for demos): keep RLS disabled
alter table public.player_stats disable row level security;

-- Option B: enable RLS with permissive policies (uncomment to use)
-- Note: this opens the table to anon clients; appropriate for demos only.
-- alter table public.player_stats enable row level security;
-- drop policy if exists "player_stats_select_all" on public.player_stats;
-- create policy "player_stats_select_all" on public.player_stats for select using (true);
-- drop policy if exists "player_stats_insert_all" on public.player_stats;
-- create policy "player_stats_insert_all" on public.player_stats for insert with check (true);
-- drop policy if exists "player_stats_update_all" on public.player_stats;
-- create policy "player_stats_update_all" on public.player_stats for update using (true) with check (true);

-- 4) (Optional) Install a helper RPC for automation (SERVICE ROLE ONLY)
-- SECURITY WARNING: Do not expose this to anon. Keep restricted to service role.
-- create or replace function public.run_sql(query text)
-- returns void
-- language plpgsql security definer
-- set search_path = public
-- as $$
-- begin
--   execute query;
-- end
-- $$;

-- Verification queries (run after script):
-- select table_schema, table_name
-- from information_schema.tables
-- where table_schema = 'public' and table_name = 'player_stats';
--
-- select * from public.player_stats order by updated_at desc limit 10;
