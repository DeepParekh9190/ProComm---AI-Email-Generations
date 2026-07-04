"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Users,
  Sparkles,
  ShieldCheck,
  LayoutGrid,
  ArrowUpRight,
  TrendingUp,
  Activity,
  SlidersHorizontal,
} from "lucide-react";

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!value) return;
    const start = performance.now();
    const animate = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

// ─── Tiny Bar Chart ───────────────────────────────────────────────────────────
function BarChart({ data = [], color }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-px h-12">
      {data.map((d, i) => (
        <div
          key={i}
          className="relative flex-1 rounded-sm group cursor-default"
          style={{
            height: `${Math.max((d.count / max) * 100, 3)}%`,
            backgroundColor: color,
            opacity: 0.2 + (i / data.length) * 0.8,
          }}
        >
          {d.count > 0 && (
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] rounded px-1 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              {d.date?.slice(5)}: {d.count}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Avatar initials ─────────────────────────────────────────────────────────
function Avatar({ name, email }) {
  const text = name || email || "?";
  const letters = text.split(/[\s@]+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  const palettes = [["#dbeafe","#2563eb"],["#ede9fe","#7c3aed"],["#d1fae5","#059669"],["#fef3c7","#d97706"],["#fce7f3","#db2777"]];
  const [bg, fg] = palettes[(text.charCodeAt(0) || 0) % palettes.length];
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ backgroundColor: bg, color: fg }}>
      {letters}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent, loading }) {
  return (
    <div className="relative flex items-center gap-4 rounded-2xl bg-white border border-gray-100 px-5 py-4 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(circle at top right, ${accent}10 0%, transparent 60%)` }} />
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}15` }}>
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <div className="relative min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide truncate">{label}</p>
        {loading ? (
          <div className="mt-1 h-7 w-12 rounded-md bg-gray-100 animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 leading-tight">
            <AnimatedNumber value={value} />
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Plan colour map ──────────────────────────────────────────────────────────
const PLAN_COLORS = { annual: "#7c3aed", monthly: "#2563eb", developer: "#0891b2", admin: "#16a34a", free: "#9ca3af", Monthly: "#2563eb", Annual: "#7c3aed" };

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Total Users",  key: "totalUsers",        icon: Users,       accent: "#2563eb" },
    { label: "AI Rewrites",  key: "totalMonthlyUsage", icon: Sparkles,    accent: "#d97706" },
    { label: "Admin Users",  key: "totalAdmins",       icon: ShieldCheck, accent: "#e11d48" },
    { label: "Active Plans", key: "activePlans",        icon: LayoutGrid,  accent: "#0891b2" },
  ];

  const planTotal = stats?.planDistribution?.reduce((s, p) => s + p.count, 0) || 1;

  return (
    <div className="flex flex-col gap-5 h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">Live overview · ProComm platform</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Live data
        </span>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {statCards.map((c) => (
          <StatCard key={c.key} label={c.label} value={stats?.[c.key] ?? 0} icon={c.icon} accent={c.accent} loading={loading} />
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* New Signups */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-gray-800">New Signups</p>
              <p className="text-[11px] text-gray-400">Last 30 days</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
              <TrendingUp className="h-3 w-3" />
              {loading ? "…" : stats?.newUsersLast30 ?? 0} new
            </div>
          </div>
          {loading
            ? <div className="h-12 rounded-lg bg-gray-50 animate-pulse" />
            : <BarChart data={stats?.dailySignups ?? []} color="#2563eb" />
          }
          {!loading && stats?.dailySignups?.length > 0 && (
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-gray-300">{stats.dailySignups[0]?.date?.slice(5)}</span>
              <span className="text-[9px] text-gray-300">{stats.dailySignups[stats.dailySignups.length - 1]?.date?.slice(5)}</span>
            </div>
          )}
        </div>

        {/* Plan Distribution */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-gray-800">Plan Distribution</p>
              <p className="text-[11px] text-gray-400">Users per plan</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-violet-50 border border-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
              <Activity className="h-3 w-3" />
              {loading ? "…" : planTotal} users
            </div>
          </div>
          {loading
            ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-5 rounded bg-gray-50 animate-pulse" />)}</div>
            : (
              <div className="space-y-2">
                {(stats?.planDistribution ?? []).filter(p => p.count > 0).sort((a, b) => b.count - a.count).map((p) => {
                  const pct = Math.round((p.count / planTotal) * 100);
                  const color = PLAN_COLORS[p.plan] || "#9ca3af";
                  return (
                    <div key={p.plan}>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="font-semibold text-gray-600 capitalize">{p.plan}</span>
                        <span className="text-gray-400">{p.count} · {pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      </div>

      {/* ── Bottom row: Recent Signups + Quick Actions ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Recent Signups — takes 2/3 */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
            <p className="text-sm font-bold text-gray-800">Recent Signups</p>
            <Link href="/admin/users" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
              All users <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading
              ? [1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                    <div className="h-7 w-7 rounded-full bg-gray-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1"><div className="h-2.5 w-32 rounded bg-gray-100 animate-pulse" /><div className="h-2 w-20 rounded bg-gray-50 animate-pulse" /></div>
                  </div>
                ))
              : (stats?.recentSignups ?? []).slice(0, 5).map((u) => (
                  <div key={u.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50/70 transition-colors">
                    <Avatar name={u.name} email={u.email} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{u.name || u.email}</p>
                      {u.name && <p className="text-[10px] text-gray-400 truncate">{u.email}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {u.role === "admin" && (
                        <span className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">admin</span>
                      )}
                      {u.plan && (
                        <span className="rounded-full border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500 capitalize">{u.plan}</span>
                      )}
                      <span className="text-[10px] text-gray-300">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
                      </span>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>

        {/* Quick Actions — takes 1/3 */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Quick Actions</p>

          <Link href="/admin/users" className="group flex items-center gap-3 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
            <div className="rounded-xl bg-blue-50 p-2.5 group-hover:bg-blue-100 transition-colors">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">Manage Users</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Roles & accounts</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </Link>

          <Link href="/admin/ai-models" className="group flex items-center gap-3 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm hover:shadow-md hover:border-violet-100 transition-all">
            <div className="rounded-xl bg-violet-50 p-2.5 group-hover:bg-violet-100 transition-colors">
              <Sparkles className="h-4 w-4 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">AI Models</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Configure providers</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-violet-500 transition-colors" />
          </Link>

          <Link href="/admin/telemetry" className="group flex items-center gap-3 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm hover:shadow-md hover:border-amber-100 transition-all">
            <div className="rounded-xl bg-amber-50 p-2.5 group-hover:bg-amber-100 transition-colors">
              <Activity className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">Telemetry & Logs</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Audit cost & speed</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
          </Link>

          <Link href="/admin/prompt-editor" className="group flex items-center gap-3 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm hover:shadow-md hover:border-violet-100 transition-all">
            <div className="rounded-xl bg-violet-50 p-2.5 group-hover:bg-violet-100 transition-colors">
              <SlidersHorizontal className="h-4 w-4 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">Prompt Editor</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Edit system instructions</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-violet-500 transition-colors" />
          </Link>

          <Link href="/" className="group flex items-center gap-3 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
            <div className="rounded-xl bg-gray-50 p-2.5 group-hover:bg-gray-100 transition-colors">
              <ArrowUpRight className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">Open App</p>
              <p className="text-[11px] text-gray-400 mt-0.5">User interface</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </Link>
        </div>
      </div>

    </div>
  );
}
