"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  Cpu,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronUp,
  ShieldCheck,
  Activity,
  SlidersHorizontal,
} from "lucide-react";
import Logo from "@/components/layout/Logo";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/ai-models", label: "AI Models", icon: Cpu },
  { href: "/admin/telemetry", label: "Telemetry & Logs", icon: Activity },
  { href: "/admin/prompt-editor", label: "Prompt Editor", icon: SlidersHorizontal },
];

export default function AdminLayout({ children }) {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  const isGatewayPage = pathname === "/admin";

  // Handle outside click for the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isGatewayPage) {
      setChecking(false);
      return;
    }

    const check = async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/admin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, name, email")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        router.push("/");
        return;
      }

      setAdminUser({
        name: profile.name || user.email?.split("@")[0] || "Admin",
        email: user.email || profile.email,
      });
      setIsAdmin(true);
      setChecking(false);
    };
    check();
  }, [router, isGatewayPage]);

  const handleLogout = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-400">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <>{children}</>;
  }

  const initials = (adminUser?.name || "A")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-100 bg-white shadow-sm transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo area - h-16, border-b border-gray-100 */}
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5 bg-white">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <Logo className="h-7 w-7 text-blue-600" width={28} height={28} />
            <div className="flex items-baseline gap-1.5">
              <span className="text-[15px] font-bold text-gray-900">
                ProComm
              </span>
              <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[9px] font-extrabold text-violet-700 uppercase tracking-wider">
                Admin
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Account Dropdown */}
        <div className="border-t border-gray-100 p-3 relative" ref={dropdownRef}>
          {dropdownOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl border border-gray-100 bg-white shadow-xl py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="px-3 py-2 border-b border-gray-50 mb-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">
                      {adminUser?.name}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {adminUser?.email}
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back to App
              </Link>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          )}

          {/* Trigger button */}
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-full flex items-center justify-between rounded-2xl border border-gray-100 bg-white hover:bg-gray-50/50 p-2.5 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">
                  {adminUser?.name}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {adminUser?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 shrink-0 text-blue-500" />
              <ChevronUp className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            </div>
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar - h-16, border-b border-gray-100 */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-100 bg-white/80 backdrop-blur-xl px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="font-semibold text-gray-800">
              {navItems.find((n) => pathname.startsWith(n.href))?.label ||
                "Admin"}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-hidden p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
