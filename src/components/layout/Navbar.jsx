"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Menu, X, Shield, Sun, Moon } from "lucide-react";
import Logo from "./Logo";
export default function Navbar() {
  const [user, setUser] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const router = useRouter();
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


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

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
    setProfileOpen(false);
    router.refresh();
    router.push("/login");
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const supabase = await createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (currentUser) {
        const { error } = await supabase.from("profiles").update({ name: newName.trim() }).eq("id", currentUser.id);
        if (!error) {
          setProfileName(newName.trim());
          setEditingName(false);
          router.refresh();
        }
      }
    } catch (err) {
      console.error("Failed to update user name:", err);
    }
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
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-text-primary transition-all duration-200 hover:shadow-sm focus:outline-none cursor-pointer flex items-center justify-center"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4 text-slate-500" />
            ) : (
              <Sun className="h-4 w-4 text-amber-500" />
            )}
          </button>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              {/* User Button */}
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 px-2 py-1.5 text-sm font-bold text-text-primary transition-all duration-200 hover:shadow-sm hover:border-brand-300 focus:outline-none cursor-pointer"
              >
                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-600 text-[11px] font-extrabold text-white shadow-sm select-none shrink-0">
                  {getInitials(profileName, user.email)}
                </div>
                <span className="max-w-[120px] sm:max-w-[180px] truncate font-bold tracking-tight text-text-primary text-sm pr-1">
                  {profileName || user.email.split("@")[0]}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-3.5 w-3.5 text-text-muted transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {profileOpen && (
                <>
                  {/* Invisible backdrop to close on outside click */}
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  {/* Dropdown Card */}
                  <div
                    className="absolute right-0 top-full mt-2 z-50 w-[90vw] sm:w-72 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden"
                    style={{ animation: "dropdownIn 0.18s cubic-bezier(0.16,1,0.3,1)" }}
                  >
                    {/* Profile Header */}
                    <div className="relative bg-gradient-to-br from-brand-50 to-accent-50/30 px-5 pt-5 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-600 text-base font-extrabold text-white shadow-md select-none shrink-0">
                          {getInitials(profileName, user.email)}
                        </div>
                        <div className="min-w-0 flex-1">
                          {editingName ? (
                            <form onSubmit={handleUpdateName} className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full rounded-lg border border-brand-300 bg-white px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                placeholder="Your name"
                                autoFocus
                              />
                              <button
                                type="submit"
                                className="rounded-md bg-brand-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-brand-700 cursor-pointer shrink-0"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingName(false)}
                                className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-text-secondary hover:bg-slate-200 cursor-pointer shrink-0"
                              >
                                ✕
                              </button>
                            </form>
                          ) : (
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-sm font-extrabold text-text-primary truncate leading-tight">
                                {profileName || user.email.split("@")[0]}
                              </span>
                              <button
                                onClick={() => {
                                  setNewName(profileName);
                                  setEditingName(true);
                                }}
                                className="p-0.5 rounded text-text-muted hover:text-brand-600 cursor-pointer shrink-0 transition-colors"
                                title="Edit name"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                              </button>
                            </div>
                          )}
                          <p className="text-[11px] text-text-secondary truncate leading-tight mt-0.5">{user.email}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-3 py-0.5 text-[10px] font-bold text-brand-700">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-2.5 w-2.5"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          Unlimited Free Account
                        </span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1.5">
                      {isAdmin && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
                        >
                          <Shield className="h-4 w-4 shrink-0" />
                          Admin Panel
                        </Link>
                      )}
                      <div className="mx-3 my-1 border-t border-slate-100" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 shrink-0" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
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

          <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden p-2 text-text-secondary">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-white px-4 py-4 sm:hidden">
          <nav className="flex flex-col gap-3">
            <Link
              href="/how-it-works"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-semibold text-text-secondary"
            >
              How It Works
            </Link>
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-semibold text-brand-600"
                  >
                    <Shield className="h-4 w-4" />
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-sm font-semibold text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-semibold text-text-secondary"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white text-center"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
