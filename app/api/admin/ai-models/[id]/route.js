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

  const { id } = params;
  const body = await request.json();

  const updates = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.model_id !== undefined) updates.model_id = body.model_id;
  if (body.is_active !== undefined) updates.is_active = body.is_active;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

  if (body.is_default) {
    await supabaseAdmin.from("ai_models").update({ is_default: false }).neq("id", id);
    updates.is_default = true;
  } else if (body.is_default === false) {
    updates.is_default = false;
  }

  const { data, error } = await supabaseAdmin
    .from("ai_models")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ model: data });
}

export async function DELETE(request, { params }) {
  const auth = await checkAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = params;

  const { error } = await supabaseAdmin.from("ai_models").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
