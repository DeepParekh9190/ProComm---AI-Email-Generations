import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sanitizeAdminInput } from "@/lib/validation";

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

  if (body.model_id !== undefined && body.model_id.length > 300) {
    return NextResponse.json({ error: "model_id too long" }, { status: 400 });
  }

  const updates = {};
  if (body.name !== undefined) updates.name = sanitizeAdminInput(body.name);
  if (body.model_id !== undefined) updates.model_id = body.model_id.trim();
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
  if (body.sort_order !== undefined) updates.sort_order = typeof body.sort_order === "number" ? body.sort_order : 0;

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

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });

  return NextResponse.json({ model: data });
}

export async function DELETE(request, { params }) {
  const auth = await checkAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = params;

  const { error } = await supabaseAdmin.from("ai_models").delete().eq("id", id);

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });

  return NextResponse.json({ success: true });
}
