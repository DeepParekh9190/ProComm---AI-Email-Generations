import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPromptSettings, updatePromptSettings } from "@/lib/telemetry";

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
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const settings = await getPromptSettings();
  return NextResponse.json(settings);
}

export async function POST(request) {
  const auth = await checkAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    if (typeof body.systemPromptTemplate !== "string") {
      return NextResponse.json({ error: "Invalid prompt template" }, { status: 400 });
    }

    const success = await updatePromptSettings({
      systemPromptTemplate: body.systemPromptTemplate
    });

    if (success) {
      return NextResponse.json({ success: true, message: "Prompt settings saved." });
    } else {
      return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
    }
  } catch (error) {
    console.error("Failed to update prompt settings:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
