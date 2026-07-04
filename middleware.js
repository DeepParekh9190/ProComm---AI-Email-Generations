import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { validateEnv } from "@/lib/env";

const publicRoutes = ["/login", "/signup", "/how-it-works", "/forgot-password", "/reset-password", "/admin"];
const publicApiRoutes = [
  "/api/webhook",
  "/api/admin",
  "/api/plans",
];

function redirectWithCookies(url, request, supabaseResponse) {
  const redirectResponse = NextResponse.redirect(new URL(url, request.url));
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      maxAge: cookie.maxAge,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      expires: cookie.expires,
      httpOnly: cookie.httpOnly,
    });
  });
  return redirectResponse;
}

export async function middleware(request) {
  if (!validateEnv()) {
    // Don't crash — allow the request through so pages/APIs can show proper error
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isPublic =
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    publicApiRoutes.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth");

  if (!user) {
    if (isPublic) return supabaseResponse;
    if (pathname.startsWith("/admin/")) {
      return redirectWithCookies("/admin", request, supabaseResponse);
    }
    const redirectParam = pathname === "/" ? "" : `?redirect=${encodeURIComponent(pathname)}`;
    return redirectWithCookies(`/login${redirectParam}`, request, supabaseResponse);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";

  if (pathname === "/login" || pathname === "/signup") {
    return redirectWithCookies(isAdmin ? "/admin/dashboard" : "/", request, supabaseResponse);
  }

  if (pathname === "/admin" && isAdmin) {
    return redirectWithCookies("/admin/dashboard", request, supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
