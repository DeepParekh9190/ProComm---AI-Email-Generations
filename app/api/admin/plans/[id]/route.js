import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sanitizeAdminInput, validatePrice, validatePeriod, validateFeatures } from "@/lib/validation";

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

export async function PATCH(request, { params }) {
  const auth = await checkAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = await request.json();

  const updates = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    updates.name = sanitizeAdminInput(body.name);
  }
  if (body.price !== undefined) {
    if (!validatePrice(body.price)) {
      return NextResponse.json({ error: "Invalid price format" }, { status: 400 });
    }
    updates.price = body.price;
  }
  if (body.period !== undefined) {
    if (!validatePeriod(body.period)) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }
    updates.period = body.period;
  }
  if (body.description !== undefined) updates.description = sanitizeAdminInput(body.description);
  if (body.features !== undefined) {
    if (!validateFeatures(body.features)) {
      return NextResponse.json({ error: "Invalid features" }, { status: 400 });
    }
    updates.features = body.features;
  }
  if (body.is_popular !== undefined) updates.is_popular = Boolean(body.is_popular);
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
  if (body.sort_order !== undefined) updates.sort_order = typeof body.sort_order === "number" ? body.sort_order : 0;
  if (body.usage_limit !== undefined) updates.usage_limit = typeof body.usage_limit === "number" ? body.usage_limit : null;

  const { error } = await supabaseAdmin.from("pricing_plans").update(updates).eq("id", id);

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request, { params }) {
  const auth = await checkAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  const { error } = await supabaseAdmin.from("pricing_plans").delete().eq("id", id);

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
  return NextResponse.json({ success: true });
}
