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

  if (body.role !== undefined) {
    if (!["user", "admin"].includes(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from("profiles").update({ role: body.role }).eq("id", id);

    if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (body.subscription !== undefined) {
    const { data: existing } = await supabaseAdmin.from("subscriptions").select("id").eq("user_id", id).maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin.from("subscriptions").update(body.subscription).eq("user_id", id);
      if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
    } else {
      const { error } = await supabaseAdmin.from("subscriptions").insert({ user_id: id, ...body.subscription });
      if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request, { params }) {
  const auth = await checkAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  await supabaseAdmin.from("subscriptions").delete().eq("user_id", id);
  await supabaseAdmin.from("profiles").delete().eq("id", id);
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
  return NextResponse.json({ success: true });
}
