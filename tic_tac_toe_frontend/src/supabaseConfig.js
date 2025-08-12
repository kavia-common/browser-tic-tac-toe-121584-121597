/**
 * PUBLIC_INTERFACE
 * getSupabaseEnv
 * Read Supabase environment variables from the CRA runtime environment.
 * Returns an object with url and key (may be undefined if not configured).
 */
export function getSupabaseEnv() {
  /** Read REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY from process.env. */
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_KEY;
  return { url, key };
}
