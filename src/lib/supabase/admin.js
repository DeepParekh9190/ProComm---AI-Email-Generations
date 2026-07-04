import { createClient } from "@supabase/supabase-js";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing Supabase env vars for admin client");
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

let _instance = null;

function getInstance() {
  if (!_instance) {
    _instance = createAdminClient();
  }
  return _instance;
}

export const supabaseAdmin = new Proxy(
  {},
  {
    get(_, prop) {
      const client = getInstance();
      if (!client) {
        throw new Error("Supabase admin client is not configured");
      }
      const value = client[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
);
