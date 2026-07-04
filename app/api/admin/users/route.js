import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function checkAdmin(request) {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
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
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", status: 401 };

  const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "admin") return { error: "Forbidden", status: 403 };

  return { user };
}

export async function GET(request) {
  const auth = await checkAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 20;
  const offset = (page - 1) * limit;

  let dbQuery = supabaseAdmin.from("profiles").select("id, email, name, role, created_at", { count: "exact" });

  if (query) {
    dbQuery = dbQuery.or(`email.ilike.%${query}%,name.ilike.%${query}%`);
  }

  dbQuery = dbQuery.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data: profiles, count, error } = await dbQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = profiles.map((p) => p.id);
  const { data: subscriptions } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, plan, status, monthly_usage, current_period_end, updated_at")
    .in("user_id", userIds);

  const subMap = {};
  for (const sub of subscriptions || []) {
    subMap[sub.user_id] = sub;
  }

  const users = profiles.map((p) => ({
    ...p,
    subscription: subMap[p.id] || null,
  }));

  return NextResponse.json({ users, total: count, page, limit });
}
