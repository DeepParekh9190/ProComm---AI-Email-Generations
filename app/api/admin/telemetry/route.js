import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTelemetryLogs } from "@/lib/telemetry";
import fs from "fs";
import path from "path";

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

  const logs = await getTelemetryLogs();
  return NextResponse.json({ logs });
}

export async function POST(request) {
  const auth = await checkAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { action } = await request.json();
    
    if (action === "clear") {
      const filePath = path.join(process.cwd(), "src", "lib", "data", "telemetry_logs.json");
      await fs.promises.writeFile(filePath, JSON.stringify([], null, 2), "utf-8");
      return NextResponse.json({ success: true, message: "Telemetry logs cleared." });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to execute telemetry action:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
