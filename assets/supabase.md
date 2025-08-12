# Supabase Integration - Tic Tac Toe Frontend

This app reads Supabase credentials from environment variables and stores per-player game statistics (wins, draws).

- Frontend env keys used:
  - REACT_APP_SUPABASE_URL
  - REACT_APP_SUPABASE_KEY

Detected in container: both variables are present and used by the client.

## What the app does

- Prompts for Player X and O names before the first move.
- Ensures both players exist in the `player_stats` table (upsert).
- After each game:
  - Winner’s `wins` is incremented by 1.
  - For a draw, both players’ `draws` are incremented by 1.
- Reloads fresh stats and displays them under the board.

## Automated Setup Attempt (via SupabaseTools)

During automated configuration, attempts to inspect and modify the database returned:

- Error code: PGRST202
- Message: "Could not find the function public.run_sql(query) in the schema cache"

Because the PostgREST RPC function public.run_sql is not available in this project, automated SQL execution could not proceed. The application code and environment are ready; please complete the database setup using the manual steps below (takes under a minute).

## Manual Setup (SQL to run in Supabase)

1) In your Supabase Dashboard, open SQL editor.
2) Copy and run the SQL from this project file:
   - `assets/sql/setup_player_stats.sql`

That script will:
- Create `public.player_stats` (if not exists)
- Install an `updated_at` trigger to maintain timestamps
- Provide two RLS configuration options:
  - Option A (default): keep RLS disabled (simplest for demos)
  - Option B: enable RLS and add permissive select/insert/update policies for anon usage

If you prefer, here is the minimal table definition:

```sql
create table if not exists public.player_stats (
  name text primary key,
  wins bigint not null default 0,
  draws bigint not null default 0,
  updated_at timestamptz not null default now()
);
```

## Verifying Setup

Run in SQL editor:
```sql
-- Does the table exist?
select table_schema, table_name
from information_schema.tables
where table_schema = 'public' and table_name = 'player_stats';

-- Check sample data (after playing one game in the app):
select * from public.player_stats order by updated_at desc limit 10;
```

If RLS is enabled, ensure the policies allow:
- select on all rows
- insert/upsert of names
- update of wins/draws

## Environment Variables

Place these in a CRA `.env` for local development (do not commit real secrets):

```
REACT_APP_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
REACT_APP_SUPABASE_KEY=YOUR_ANON_PUBLIC_KEY
```

The app reads these via `src/supabaseConfig.js`. The UI displays a small badge indicating whether Supabase env is detected.

## Code References

- Env loader: `src/supabaseConfig.js`
- Supabase client & helpers (upsert, fetch, record win/draw): `src/supabaseClient.js`
- UI logic and lifecycle (ensures players, updates stats after results): `src/App.js`

## Security Notes

- For demos, keeping RLS disabled is simplest. For production, enable RLS and add least-privilege policies. Consider moving stat updates to RPCs that validate input and using a service role key on a secure backend instead of the anon key in the browser.
- Do not store real secrets in the repo. Use environment variables.

## Troubleshooting

- If you see "Supabase env not set" in the app footer, ensure `.env` is configured and restart the dev server.
- If database calls fail with 401/permission errors and you enabled RLS, verify policies allow select/insert/update for anonymous users.
- If you want to use automated provisioning in the future, add a PostgREST RPC that runs arbitrary SQL (not recommended for production). Example (service-role only):
  ```sql
  create or replace function public.run_sql(query text)
  returns void
  language plpgsql security definer
  set search_path = public
  as $$
  begin
    execute query;
  end
  $$;
  ```
  IMPORTANT: Restrict this RPC to service role usage only; do not expose to anonymous clients.
