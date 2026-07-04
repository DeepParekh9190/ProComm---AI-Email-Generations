"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ShieldAlert, Loader2, Eye, EyeOff } from "lucide-react";
import Logo from "@/components/layout/Logo";

export default function AdminGateway() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setShowLogin(true);
        setChecking(false);
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

      if (profile?.role === "admin") {
        setIsAdmin(true);
        setChecking(false);
      } else {
        router.push("/");
      }
    };
    check();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = await createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", (await supabase.auth.getUser()).data.user.id)
      .single();

    if (profile?.role === "admin") {
      router.push("/admin/dashboard");
    } else {
      await supabase.auth.signOut();
      setError("Access denied. You do not have admin privileges.");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (isAdmin) {
    window.location.replace("/admin/dashboard");
    return null;
  }

  if (showLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-6">
              <Link href="/" className="inline-flex items-center gap-2">
                <Logo className="text-brand-600" width={36} height={36} />
                <span className="text-2xl font-bold text-[#0F172A]">ProComm</span>
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Admin Portal</h1>
            <p className="mt-1 text-sm text-text-secondary">Sign in with your admin account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-text-primary mb-1">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-text-primary mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 pr-10 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Signing in..." : "Sign in to Admin"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Back to user login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return null;
}
