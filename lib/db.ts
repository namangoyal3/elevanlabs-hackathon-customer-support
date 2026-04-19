import { createClient, type SupabaseClient } from '@supabase/supabase-js';

declare global {
  // eslint-disable-next-line no-var
  var __supabaseAdmin: SupabaseClient | undefined;
}

function buildClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url) throw new Error('SUPABASE_URL is not set. Add it to .env.local.');
  if (!secretKey) {
    throw new Error('SUPABASE_SECRET_KEY is not set. Add it to .env.local.');
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
    // Next.js wraps fetch() with per-request caching. Supabase JS uses fetch
    // internally, so without this override RPC results get served stale from
    // Next's cache. Explicit no-store keeps every call fresh — critical once
    // Phase 3 starts updating transcript + RAG state in real time.
    global: {
      fetch: (input, init) =>
        fetch(input as RequestInfo, { ...(init as RequestInit | undefined), cache: 'no-store' }),
    },
  });
}

export function supabaseAdmin(): SupabaseClient {
  if (!global.__supabaseAdmin) {
    global.__supabaseAdmin = buildClient();
  }
  return global.__supabaseAdmin;
}
