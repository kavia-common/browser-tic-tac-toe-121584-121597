import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './supabaseConfig';

const TABLE = 'player_stats';

const env = getSupabaseEnv();

/**
 * Internal cached Supabase client created from environment variables.
 * Will be null if env is not provided.
 */
const supabase = env.url && env.key ? createClient(env.url, env.key) : null;

// PUBLIC_INTERFACE
export function getClient() {
  /**
   * Return the Supabase client instance if environment variables are set,
   * otherwise returns null. Use this to guard DB calls in the UI.
   */
  return supabase;
}

// PUBLIC_INTERFACE
export async function ensurePlayers(names = []) {
  /**
   * Ensure all players in the provided list exist in the player_stats table.
   * Performs an upsert with default 0 values for wins/draws.
   * Safe to call multiple times.
   */
  if (!supabase || !Array.isArray(names) || names.length === 0) return { data: [], error: null };
  const rows = names
    .filter((n) => !!n)
    .map((name) => ({ name, wins: 0, draws: 0 }));
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: 'name', ignoreDuplicates: false })
    .select('name,wins,draws');
  return { data, error };
}

// PUBLIC_INTERFACE
export async function fetchPlayerStats(names = []) {
  /**
   * Fetch stats for a list of player names. Returns a map of name -> {wins, draws}.
   * Missing players will not be present in the map.
   */
  if (!supabase || !Array.isArray(names) || names.length === 0) return {};
  const { data, error } = await supabase
    .from(TABLE)
    .select('name,wins,draws')
    .in('name', names);
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('Supabase fetchPlayerStats error:', error.message);
    return {};
  }
  const map = {};
  (data || []).forEach((row) => {
    map[row.name] = { wins: row.wins ?? 0, draws: row.draws ?? 0 };
  });
  return map;
}

// PUBLIC_INTERFACE
export async function recordWin(winnerName) {
  /**
   * Increment the win counter for the winner. Not atomic in a highly concurrent
   * environment but acceptable for demo/low traffic usage.
   */
  if (!supabase || !winnerName) return { data: null, error: null };
  // Ensure row exists
  await ensurePlayers([winnerName]);
  const { data: current, error: readErr } = await supabase
    .from(TABLE)
    .select('wins')
    .eq('name', winnerName)
    .single();
  if (readErr) return { data: null, error: readErr };
  const newWins = (current?.wins ?? 0) + 1;
  const { data, error } = await supabase
    .from(TABLE)
    .update({ wins: newWins })
    .eq('name', winnerName)
    .select('name,wins,draws')
    .single();
  return { data, error };
}

// PUBLIC_INTERFACE
export async function recordDraw(names = []) {
  /**
   * Increment the draw counter for each named player.
   */
  if (!supabase || !Array.isArray(names) || names.length === 0) return { data: [], error: null };
  await ensurePlayers(names);
  const results = [];
  for (const name of names) {
    const { data: current, error: readErr } = await supabase
      .from(TABLE)
      .select('draws')
      .eq('name', name)
      .single();
    if (readErr) {
      results.push({ name, error: readErr });
      continue;
    }
    const newDraws = (current?.draws ?? 0) + 1;
    const { data, error } = await supabase
      .from(TABLE)
      .update({ draws: newDraws })
      .eq('name', name)
      .select('name,wins,draws')
      .single();
    results.push({ name, data, error });
  }
  return { data: results, error: null };
}
