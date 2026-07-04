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

export async function PATCH(request, { params }) {
  const auth = await checkAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = await request.json();

  const updates = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.price !== undefined) updates.price = body.price;
  if (body.period !== undefined) updates.period = body.period;
  if (body.description !== undefined) updates.description = body.description;
  if (body.features !== undefined) updates.features = body.features;
  if (body.is_popular !== undefined) updates.is_popular = body.is_popular;
  if (body.is_active !== undefined) updates.is_active = body.is_active;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.usage_limit !== undefined) updates.usage_limit = body.usage_limit;

  const { error } = await supabaseAdmin.from("pricing_plans").update(updates).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request, { params }) {
  const auth = await checkAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  const { error } = await supabaseAdmin.from("pricing_plans").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
