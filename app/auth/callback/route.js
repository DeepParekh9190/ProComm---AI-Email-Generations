import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Read redirect path from cookie (set by signInWithGoogle)
  const nextCookie = request.cookies.get("auth_redirect");
  const next = nextCookie?.value ? decodeURIComponent(nextCookie.value) : "/";

  if (code) {
    let supabaseResponse = NextResponse.redirect(`${origin}${next}`);

    // Clear the redirect cookie
    supabaseResponse.cookies.set("auth_redirect", "", { maxAge: 0, path: "/" });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.redirect(`${origin}${next}`);
            supabaseResponse.cookies.set("auth_redirect", "", { maxAge: 0, path: "/" });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
    return supabaseResponse;
  }

  return NextResponse.redirect(`${origin}/pricing`);
}
