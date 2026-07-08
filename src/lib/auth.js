import { createClient } from "@/lib/supabase/client";

export async function signInWithGoogle(redirectTo) {
  const supabase = await createClient();
  const redirectUrl = redirectTo || window.location.origin;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
    },
  });

  if (error) {
    throw error;
  }
}
