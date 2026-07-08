import { createClient, clearClient } from "@/lib/supabase/client";

export async function signInWithGoogle(redirectTo) {
  const supabase = await createClient();
  const redirectPath = redirectTo || "/";

  // Clear any stale OAuth state from previous attempts
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("sb-") && key.includes("code-verifier")) {
      localStorage.removeItem(key);
    }
  }

  // Store redirect path in a cookie so the callback route can read it
  document.cookie = `auth_redirect=${encodeURIComponent(redirectPath)}; path=/; max-age=300; SameSite=Lax`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  clearClient();
  window.location.href = "/login";
}
