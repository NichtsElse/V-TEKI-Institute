/**
 * Purpose: Initialize and export the Supabase client for the V-TEKI application with a safe local fallback.
 * Used by: Auth context, API client, and any component needing direct Supabase access.
 * Main dependencies: @supabase/supabase-js, Vite environment variables.
 * Public/main functions: `supabase` client instance.
 * Important side effects: Creates a singleton Supabase client on module load when valid credentials are present.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY || import.meta.env.SUPABASE_ANON_KEY;
const enableFlag = import.meta.env.VITE_ENABLE_SUPABASE;
const hasPlaceholderCredentials =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl === 'your_supabase_url' ||
  supabaseAnonKey === 'your_supabase_anon_key';
const supabaseEnabled = enableFlag == null
  ? Boolean(supabaseUrl && supabaseAnonKey && !hasPlaceholderCredentials)
  : enableFlag === 'true' && !hasPlaceholderCredentials;

if (supabaseEnabled && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    '[V-TEKI] Supabase credentials not found in environment variables. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file. ' +
    'Falling back to local mock mode.'
  );
}

export const supabase = supabaseEnabled && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => !!supabase;
