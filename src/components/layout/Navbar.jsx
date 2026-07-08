"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Menu, X, Shield, Sun, Moon, ExternalLink } from "lucide-react";
import Logo from "./Logo";
export default function Navbar() {
  const [user, setUser] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const initialTheme = savedTheme === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      if (parts[0]) {
        return parts[0].slice(0, 2).toUpperCase();
      }
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "US";
  };

  useEffect(() => {
    let authSubscription;
    const currentUserRef = { current: null };
    const supabasePromise = createClient();

    const fetchUserData = async (currentUser) => {
      if (!currentUser) {
        setProfileName("");
        setIsAdmin(false);
        return;
      }

      try {
        const supabase = await supabasePromise;
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, name")
          .eq("id", currentUser.id)
          .maybeSingle();

        const nameToUse =
          profile?.name || currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || "";
        setProfileName(nameToUse);
        setIsAdmin(profile?.role === "admin");

        if (profile && !profile.name && nameToUse) {
          await supabase.from("profiles").update({ name: nameToUse }).eq("id", currentUser.id);
        }
      } catch (err) {
        console.error("Error fetching user navbar data:", err);
      }
    };

    const init = async () => {
      const supabase = await supabasePromise;
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        currentUserRef.current = data.user;
        setUser(data.user);
        await fetchUserData(data.user);
      }

      const res = supabase.auth.onAuthStateChange(async (_event, session) => {
        const currentUser = session?.user ?? null;
        currentUserRef.current = currentUser;
        setUser(currentUser);
        await fetchUserData(currentUser);
      });
      authSubscription = res?.data?.subscription;
    };
    init();

    const handleUsageUpdate = () => {
      if (currentUserRef.current) {
        fetchUserData(currentUserRef.current);
      }
    };

    window.addEventListener("usage-updated", handleUsageUpdate);

    return () => {
      authSubscription?.unsubscribe();
      window.removeEventListener("usage-updated", handleUsageUpdate);
    };
  }, []);

  const handleLogout = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
    router.refresh();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 cursor-pointer group">
            <Logo
              className="h-6 w-6 text-brand-600 group-hover:scale-105 transition-transform"
              width={24}
              height={24}
            />
            <span className="text-xl font-bold tracking-tight text-text-primary group-hover:text-brand-600 transition-colors">
              ProComm
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/how-it-works"
              className="text-sm font-semibold text-text-secondary hover:text-brand-600 transition-colors"
            >
              How It Works
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop: Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="hidden md:flex p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-text-primary transition-all duration-200 hover:shadow-sm focus:outline-none cursor-pointer items-center justify-center"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4 text-slate-500" />
            ) : (
              <Sun className="h-4 w-4 text-amber-500" />
            )}
          </button>

          {/* Desktop: User Button */}
          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/how-it-works"
                className="text-sm font-semibold text-text-secondary hover:text-brand-600 transition-colors"
              >
                How It Works
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-semibold text-text-secondary hover:text-brand-600 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile: Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Full-Screen Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-white dark:bg-[#0F172A]">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
              <span className="text-base font-extrabold text-text-primary">Menu</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {user ? (
                <>
                  {/* Profile Section */}
                  <div className="px-5 pt-6 pb-4 border-b border-border">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-600 text-lg font-extrabold text-white shadow-md select-none shrink-0">
                        {getInitials(profileName, user.email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-extrabold text-text-primary truncate">
                          {profileName || user.email.split("@")[0]}
                        </p>
                        <p className="text-sm text-text-secondary truncate mt-0.5">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="px-3 py-3 space-y-0.5">
                    <Link
                      href="/how-it-works"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ExternalLink className="h-5 w-5 shrink-0 text-text-muted" />
                      How It Works
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
                      >
                        <Shield className="h-5 w-5 shrink-0" />
                        Admin Panel
                      </Link>
                    )}

                    <button
                      onClick={toggleTheme}
                      className="flex w-full items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {theme === "light" ? (
                        <Moon className="h-5 w-5 shrink-0 text-text-muted" />
                      ) : (
                        <Sun className="h-5 w-5 shrink-0 text-amber-500" />
                      )}
                      <span className="flex-1 text-left">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
                      <div className={`relative h-5 w-9 rounded-full transition-colors ${theme === "dark" ? "bg-brand-600" : "bg-slate-300"}`}>
                        <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${theme === "dark" ? "translate-x-4" : ""}`} />
                      </div>
                    </button>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Sign Out at Bottom */}
                  <div className="px-3 pb-6">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-red-200 dark:border-red-900 px-4 py-3.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-5 w-5 shrink-0" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="px-5 pt-8 pb-6 text-center">
                    <p className="text-lg font-extrabold text-text-primary">Welcome</p>
                    <p className="text-sm text-text-secondary mt-1">Sign in to start rewriting</p>
                  </div>
                  <div className="px-5 space-y-3">
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center rounded-xl bg-brand-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-brand-700 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center rounded-xl border border-border px-4 py-3.5 text-sm font-bold text-text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Create Account
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
