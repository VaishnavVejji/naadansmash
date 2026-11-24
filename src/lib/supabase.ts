import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://odnjkvxqypjklsjgxpoj.supabase.co';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_cYWbnMxIdT996o4RoYu2Aw_FpgHkkVs';

// Clean the Supabase URL in case it has /rest/v1 or trailing slashes
function sanitizeSupabaseUrl(url: string): string {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

export const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
export const supabaseAnonKey = anonKey.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Real runtime test of the database connection.
 * Checks whether the Supabase REST endpoint responds and if the tables have been migrated.
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  tablesReady: boolean;
  message: string;
  details?: any;
}> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      connected: false,
      tablesReady: false,
      message: 'Supabase credentials not configured in environment variables.',
    };
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, status')
      .limit(1);

    if (error) {
      // PGRST205 indicates the database endpoint is reachable and authenticated,
      // but the table 'events' has not yet been created via SQL migration.
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return {
          connected: true,
          tablesReady: false,
          message: 'Connected to Supabase endpoint, but SQL migration pending. Run supabase/schema.sql in SQL Editor.',
          details: error,
        };
      }
      return {
        connected: false,
        tablesReady: false,
        message: `Database query returned error: ${error.message}`,
        details: error,
      };
    }

    return {
      connected: true,
      tablesReady: true,
      message: 'Connected to Supabase PostgreSQL database successfully with live tables!',
      details: data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown connection error';
    return {
      connected: false,
      tablesReady: false,
      message: `Failed to connect to Supabase: ${msg}`,
    };
  }
}
