let _createClient = null;

export async function createClient() {
  if (_createClient) return _createClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const { createBrowserClient } = await import("@supabase/ssr");
  _createClient = createBrowserClient(url, key);
  return _createClient;
}
