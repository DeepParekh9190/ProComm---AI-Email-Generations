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

export async function GET(request) {
  const auth = await checkAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: models, error } = await supabaseAdmin
    .from("ai_models")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });

  return NextResponse.json({ models });
}

export async function POST(request) {
  const auth = await checkAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();

  if (!body.name || !body.model_id) {
    return NextResponse.json({ error: "name and model_id are required" }, { status: 400 });
  }

  if (body.model_id.length > 300) {
    return NextResponse.json({ error: "model_id too long" }, { status: 400 });
  }

  if (body.is_default) {
    await supabaseAdmin.from("ai_models").update({ is_default: false }).neq("id", "00000000-0000-0000-0000-000000000000");
  }

  const { data, error } = await supabaseAdmin
    .from("ai_models")
    .insert({
      name: sanitizeAdminInput(body.name),
      model_id: body.model_id.trim(),
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      is_default: Boolean(body.is_default) || false,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });

  return NextResponse.json({ model: data }, { status: 201 });
}
