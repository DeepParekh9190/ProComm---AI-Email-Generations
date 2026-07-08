"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/auth";
import { ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";

function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const searchParams = useSearchParams();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data?.user?.identities?.length === 0) {
      setError("An account with this email already exists.");
      setLoading(false);
      return;
    }

    // Check if email confirmation is required (user won't have a session yet)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      // Email confirmation required — show notice instead of redirecting
      setConfirmationSent(true);
      setLoading(false);
      return;
    }

    // Profile is auto-created by handle_new_user() database trigger on auth.users insert.
    // Wait for the trigger to finish before redirecting (prevents race condition).
    const userId = data.user?.id;
    if (userId) {
      const maxAttempts = 10;
      for (let i = 0; i < maxAttempts; i++) {
        const { data: profile } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
        if (profile) break;
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    const redirectTo = searchParams.get("redirect") || "/";
    // Use full page navigation so the fresh session cookie is sent to the server middleware.
    window.location.href = redirectTo;
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await signInWithGoogle(searchParams.get("redirect") || "/");
    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-brand-600"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 11l2 2 4-4" strokeWidth="2.5" />
            </svg>
            <span className="text-xl font-bold text-[#0F172A]">ProComm</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-text-primary">Create your account</h1>
          <p className="mt-1 text-sm text-text-secondary">Start writing with confidence</p>
        </div>

        {confirmationSent ? (
          <div className="text-center">
            <div className="mb-6 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600 border border-green-100">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Check your email</h2>
            <p className="mt-2 text-sm text-text-secondary">
              We sent a confirmation link to <strong className="text-text-primary">{email}</strong>.
            </p>
            <p className="mt-2 text-xs text-text-muted">Click the link to activate your account, then sign in.</p>
            <Link
              href="/login"
              className="mt-8 inline-block rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                  placeholder="At least 6 characters"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface-secondary px-2 text-text-muted">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Google
            </button>

            <p className="mt-6 text-center text-sm text-text-secondary">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
