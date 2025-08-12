# Supabase Integration - Tic Tac Toe Frontend

This app reads Supabase credentials from environment variables and stores per-player game statistics (wins, draws).

## Environment Variables

Set these variables in the frontend container's environment (e.g., in a `.env` file at the project root for CRA):

- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_KEY

Example `.env`:

REACT_APP_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
REACT_APP_SUPABASE_KEY=YOUR_ANON_PUBLIC_KEY

Note: Do not commit real secrets.

## Table Schema

Create a `player_stats` table in your Supabase project:

```sql
create table if not exists public.player_stats (
  name text primary key,
  wins bigint not null default 0,
  draws bigint not null default 0,
  updated_at timestamptz not null default now()
);
```

RLS can remain disabled for demo purposes. If enabling RLS, add policies to allow select and upsert/update by anonymous users as appropriate.

## App Behavior

- On first entry of player names, the app upserts rows for those names with default wins=0, draws=0.
- After each game:
  - Winner's `wins` is incremented by 1.
  - On draw, both players' `draws` are incremented by 1.
- After updating, the app fetches fresh stats to display.

## Code References

- Env loader: `src/supabaseConfig.js`
- Supabase client & helpers: `src/supabaseClient.js`
- UI logic: `src/App.js`

If you change how the app interacts with Supabase, update this document accordingly.
