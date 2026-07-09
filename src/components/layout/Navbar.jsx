 "use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import { LogOut, Menu, X, Shield, Sun, Moon, ExternalLink, ChevronDown } from "lucide-react";
import Logo from "./Logo";
export default function Navbar() {
  const [user, setUser] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
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

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

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
    await signOut();
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

          {/* Desktop: User Dropdown */}
          {user ? (
            <div className="hidden md:flex items-center gap-3 relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-semibold text-text-primary hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                  {getInitials(profileName, user.email)}
                </span>
                <span className="max-w-[120px] truncate">{profileName || user.email.split("@")[0]}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-text-secondary transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-white shadow-lg py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-border">
                    <p className="text-sm font-bold text-text-primary truncate">{profileName || user.email.split("@")[0]}</p>
                    <p className="text-xs text-text-secondary truncate">{user.email}</p>
                  </div>
                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                    >
                      <Shield className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  )}
                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
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

      {menuOpen && typeof window !== "undefined" && createPortal(
        <div className={`fixed inset-0 z-[100] md:hidden flex flex-col ${theme === "dark" ? "bg-[#0F172A]" : "bg-white"}`}
          style={{ colorScheme: theme === "dark" ? "dark" : "light" }}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-5 h-16 border-b shrink-0 ${theme === "dark" ? "border-[#1f2937] text-[#f9fafb]" : "border-[#e5e7eb]"}`}>
            <span className={`text-base font-extrabold ${theme === "dark" ? "text-[#f9fafb]" : "text-[#111827]"}`}>Menu</span>
            <button
              onClick={() => setMenuOpen(false)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${theme === "dark" ? "text-[#9ca3af] hover:bg-[#1f2937]" : "text-[#6b7280] hover:bg-slate-100"}`}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {user ? (
              <>
                <div className={`px-5 pt-6 pb-4 border-b ${theme === "dark" ? "border-[#1f2937]" : "border-[#e5e7eb]"}`}>
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-600 text-lg font-extrabold text-white shadow-md select-none shrink-0">
                      {getInitials(profileName, user.email)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-base font-extrabold truncate ${theme === "dark" ? "text-[#f9fafb]" : "text-[#111827]"}`}>
                        {profileName || user.email.split("@")[0]}
                      </p>
                      <p className={`text-sm truncate mt-0.5 ${theme === "dark" ? "text-[#d1d5db]" : "text-[#6b7280]"}`}>{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="px-3 py-3 space-y-0.5">
                  <Link
                    href="/how-it-works"
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors ${theme === "dark" ? "text-[#f9fafb] hover:bg-[#1f2937]" : "text-[#111827] hover:bg-slate-100"}`}
                  >
                    <ExternalLink className={`h-5 w-5 shrink-0 ${theme === "dark" ? "text-[#9ca3af]" : "text-[#9ca3af]"}`} />
                    How It Works
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors ${theme === "dark" ? "text-[#93c5fd] hover:bg-[#111827]" : "text-brand-600 hover:bg-brand-50"}`}
                    >
                      <Shield className="h-5 w-5 shrink-0" />
                      Admin Panel
                    </Link>
                  )}

                  <button
                    onClick={toggleTheme}
                    className={`flex w-full items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${theme === "dark" ? "text-[#f9fafb] hover:bg-[#1f2937]" : "text-[#111827] hover:bg-slate-100"}`}
                  >
                    {theme === "light" ? (
                      <Moon className="h-5 w-5 shrink-0 text-[#9ca3af]" />
                    ) : (
                      <Sun className="h-5 w-5 shrink-0 text-amber-500" />
                    )}
                    <span className="flex-1 text-left">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
                    <div className={`relative h-5 w-9 rounded-full transition-colors ${theme === "dark" ? "bg-brand-600" : "bg-slate-300"}`}>
                      <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${theme === "dark" ? "translate-x-4" : ""}`} />
                    </div>
                  </button>
                </div>

                <div className="flex-1" />

                <div className="px-3 pb-6">
                  <button
                    onClick={handleLogout}
                    className={`flex w-full items-center justify-center gap-2.5 rounded-xl border px-4 py-3.5 text-sm font-bold transition-colors cursor-pointer ${theme === "dark" ? "border-[#7f1d1d] text-[#f87171] hover:bg-[#1c0f0f]" : "border-red-200 text-red-500 hover:bg-red-50"}`}
                  >
                    <LogOut className="h-5 w-5 shrink-0" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-5 pt-8 pb-6 text-center">
                  <p className={`text-lg font-extrabold ${theme === "dark" ? "text-[#f9fafb]" : "text-[#111827]"}`}>Welcome</p>
                  <p className={`text-sm mt-1 ${theme === "dark" ? "text-[#d1d5db]" : "text-[#6b7280]"}`}>Sign in to start rewriting</p>
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
                    className={`flex items-center justify-center rounded-xl border px-4 py-3.5 text-sm font-bold transition-colors ${theme === "dark" ? "border-[#1f2937] text-[#f9fafb] hover:bg-[#1f2937]" : "border-[#e5e7eb] text-[#111827] hover:bg-slate-50"}`}
                  >
                    Create Account
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
