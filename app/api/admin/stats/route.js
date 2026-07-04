import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function checkAdmin(request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          try {
            return request.cookies.getAll();
          } catch {
            return [];
          }
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", status: 401 };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Forbidden", status: 403 };

  return { user };
}

export async function GET(request) {
  const auth = await checkAdmin(request);
  if (auth.error)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  // Run all queries in parallel
  const [
    usersResult,
    adminsResult,
    activeSubsResult,
    activePlansResult,
    usageResult,
    allProfilesResult,
    subscriptionsResult,
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin"),
    supabaseAdmin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabaseAdmin
      .from("pricing_plans")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabaseAdmin.from("subscriptions").select("monthly_usage"),
    // Get all profiles with created_at for chart data (last 60 days)
    supabaseAdmin
      .from("profiles")
      .select("id, email, name, role, created_at")
      .order("created_at", { ascending: false }),
    // Get all subscriptions for plan distribution
    supabaseAdmin
      .from("subscriptions")
      .select("user_id, plan, status, monthly_usage"),
  ]);

  const totalMonthlyUsage = (usageResult.data || []).reduce(
    (sum, s) => sum + (s.monthly_usage || 0),
    0
  );

  const allProfiles = allProfilesResult.data || [];
  const allSubscriptions = subscriptionsResult.data || [];

  // ── Daily new signups for the last 30 days ────────────────────────────────
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const signupsPerDay = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    signupsPerDay[key] = 0;
  }

  for (const profile of allProfiles) {
    if (!profile.created_at) continue;
    const key = profile.created_at.split("T")[0];
    if (key in signupsPerDay) {
      signupsPerDay[key]++;
    }
  }

  const dailySignups = Object.entries(signupsPerDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // ── New users in last 30 days ─────────────────────────────────────────────
  const newUsersLast30 = allProfiles.filter((p) => {
    if (!p.created_at) return false;
    return new Date(p.created_at) >= thirtyDaysAgo;
  }).length;

  // ── Plan distribution ─────────────────────────────────────────────────────
  const planDist = {};
  for (const sub of allSubscriptions) {
    const plan = sub.plan || "free";
    planDist[plan] = (planDist[plan] || 0) + 1;
  }
  // Users without any subscription are "free"
  const usersWithSub = new Set(allSubscriptions.map((s) => s.user_id));
  const freeUsers = allProfiles.filter((p) => !usersWithSub.has(p.id)).length;
  planDist["free"] = (planDist["free"] || 0) + freeUsers;

  const planDistribution = Object.entries(planDist).map(([plan, count]) => ({
    plan,
    count,
  }));

  // ── Recent signups (last 8) ───────────────────────────────────────────────
  const subMap = {};
  for (const sub of allSubscriptions) {
    subMap[sub.user_id] = sub;
  }

  const recentSignups = allProfiles.slice(0, 8).map((p) => ({
    id: p.id,
    email: p.email,
    name: p.name,
    role: p.role,
    created_at: p.created_at,
    plan: subMap[p.id]?.plan || null,
    subscription_status: subMap[p.id]?.status || null,
  }));

  // ── AI usage by plan ──────────────────────────────────────────────────────
  const usageByPlan = {};
  for (const sub of allSubscriptions) {
    const plan = sub.plan || "free";
    usageByPlan[plan] = (usageByPlan[plan] || 0) + (sub.monthly_usage || 0);
  }

  return NextResponse.json({
    // Core metrics
    totalUsers: usersResult.count || 0,
    totalAdmins: adminsResult.count || 0,
    activeSubscriptions: activeSubsResult.count || 0,
    activePlans: activePlansResult.count || 0,
    totalMonthlyUsage,
    newUsersLast30,
    // Chart data
    dailySignups,
    // Breakdown data
    planDistribution,
    usageByPlan,
    // Recent activity
    recentSignups,
  });
}
