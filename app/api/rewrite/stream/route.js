import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimitByUser } from "@/lib/rate-limit";
import { streamRewrite } from "@/lib/ai/openrouter";
import { validateRewriteInput, sanitizeString, sanitizeSubject } from "@/lib/validation";

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
      return new Response(JSON.stringify({ error: "Not authenticated." }), { status: 401 });
    }

    const rl = rateLimitByUser({ userId: user.id, ip, maxRequests: 60, interval: 60000 });
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: "Too many requests." }), {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      });
    }

    const body = await req.json();
    const validationErrors = validateRewriteInput(body);
    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({ error: "Validation failed", details: validationErrors }), {
        status: 400,
      });
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

    const stream = await streamRewrite(sanitized);

    if (stream instanceof ReadableStream) {
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    return new Response(JSON.stringify(stream), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Stream API error:", e);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
