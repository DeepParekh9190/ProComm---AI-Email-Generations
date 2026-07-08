import { createClient } from "@/lib/supabase/client";

export async function signInWithGoogle(redirectTo) {
  const supabase = await createClient();
  const redirectPath = redirectTo || "/";

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
