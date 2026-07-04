import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateRewrite } from "@/lib/ai/openrouter";

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

export async function POST(request) {
  const auth = await checkAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    
    if (!body.message) {
      return NextResponse.json({ error: "Message draft is required for playground test." }, { status: 400 });
    }

    const payload = {
      message: body.message,
      communicationType: body.communicationType || "email",
      recipient: body.recipient || "",
      tone: body.tone || "Professional",
      subject: body.subject || "",
      model: body.model || "openrouter/free",
      template: body.template // custom system prompt
    };

    const startTime = performance.now();
    const result = await generateRewrite(payload);
    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    return NextResponse.json({
      data: result,
      latencyMs
    });
  } catch (error) {
    console.error("Playground test failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
