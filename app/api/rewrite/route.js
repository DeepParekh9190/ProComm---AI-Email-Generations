import { NextResponse } from "next/server";
import { generateRewrite } from "@/lib/ai/openrouter";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimitByUser } from "@/lib/rate-limit";
import { validateRewriteInput, sanitizeString, sanitizeSubject } from "@/lib/validation";
import { addTelemetryLog } from "@/lib/telemetry";

async function resolveDefaultModel() {
  const { data } = await supabaseAdmin
    .from("ai_models")
    .select("model_id")
    .eq("is_active", true)
    .eq("is_default", true)
    .single();
  return data?.model_id || null;
}

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            try {
              return req.cookies.getAll();
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
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const rl = rateLimitByUser({ userId: user.id, ip, maxRequests: 60, interval: 60000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const body = await req.json();

    const validationErrors = validateRewriteInput(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: validationErrors }, { status: 400 });
    }

    const defaultModel = body.model || (await resolveDefaultModel());

    const sanitized = {
      message: sanitizeString(body.message),
      communicationType: body.communicationType || "email",
      recipient: sanitizeString(body.recipient || ""),
      tone: body.tone || "Professional",
      subject: sanitizeSubject(body.subject || ""),
      model: defaultModel,
    };

    const startTime = performance.now();
    const result = await generateRewrite(sanitized);
    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    addTelemetryLog({
      userId: user.id,
      originalTone: result.originalTone,
      newTone: result.newTone,
      communicationType: sanitized.communicationType,
      recipient: sanitized.recipient,
      model: sanitized.model,
      latencyMs,
      promptTokens: result.promptTokens || 0,
      completionTokens: result.completionTokens || 0,
      isFallback: result.promptTokens === 0 && result.completionTokens === 0,
      draftLength: sanitized.message ? sanitized.message.length : 0,
      rewriteLength: result.rewrittenMessage ? result.rewrittenMessage.length : 0
    }).catch(err => console.error("Telemetry write failed:", err));

    return NextResponse.json({ data: result });
  } catch (e) {
    console.error("API rewrite failed:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
