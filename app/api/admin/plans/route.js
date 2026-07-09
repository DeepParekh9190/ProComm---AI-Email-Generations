import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sanitizeAdminInput, validatePrice, validatePeriod, validateFeatures, validateName } from "@/lib/validation";

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

  const { data: plans, error } = await supabaseAdmin
    .from("pricing_plans")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  return NextResponse.json({ plans });
}

export async function POST(request) {
  const auth = await checkAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();

  if (!validateName(body.name)) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if (!validatePrice(body.price)) {
    return NextResponse.json({ error: "Invalid price format (e.g. $9)" }, { status: 400 });
  }
  if (!validatePeriod(body.period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }
  if (body.features && !validateFeatures(body.features)) {
    return NextResponse.json({ error: "Invalid features" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("pricing_plans")
    .insert({
      name: sanitizeAdminInput(body.name),
      price: body.price,
      period: body.period,
      description: body.description ? sanitizeAdminInput(body.description) : null,
      features: body.features || [],
      is_popular: body.is_popular || false,
      is_active: body.is_active ?? true,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
      usage_limit: typeof body.usage_limit === "number" ? body.usage_limit : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  return NextResponse.json({ plan: data }, { status: 201 });
}
