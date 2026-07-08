"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import RewriteForm from "@/components/rewrite/RewriteForm";
import GeneratedMessage from "@/components/rewrite/GeneratedMessage";
import ImprovementsCard from "@/components/rewrite/ImprovementsCard";
import AlternativeVersions from "@/components/rewrite/AlternativeVersions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2 } from "lucide-react";

import {
  detectOriginalTone,
  generateSmartFallback,
  getImprovements,
  generateAlternatives,
} from "@/lib/ai/fallback-engine";

function extractPartialRewrittenMessage(text) {
  if (!text) return "";
  const match = text.match(/["']rewrittenMessage["']\s*:\s*["']/);
  if (!match) return "";

  const startIndex = match.index + match[0].length;
  let result = "";
  let escaped = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];
    if (escaped) {
      if (char === "n") {
        result += "\n";
      } else if (char === "t") {
        result += "\t";
      } else {
        result += char;
      }
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === '"' || char === "'") {
      break;
    } else {
      result += char;
    }
  }
  return result;
}

export default function Dashboard() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userName, setUserName] = useState("User");
  const resultRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Query profiles for role and display name
      const { data: profile } = await supabase.from("profiles").select("name, role").eq("id", user.id).maybeSingle();

      // Redirect admin users to the admin dashboard (hard redirect to reload layout)
      if (profile?.role === "admin") {
        window.location.replace("/admin/dashboard");
        return;
      }

      if (profile?.name) {
        setUserName(profile.name);
      } else if (user.user_metadata?.name) {
        setUserName(user.user_metadata.name);
      }

      setChecking(false);
    };
    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  const handleRewrite = async ({ message, communicationType, recipient, tone, subject }) => {
    setLoading(true);
    setResult(null);

    // Scroll to the result section on mobile (single-column layout)
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    const activeTone = tone || "Professional";
    const detectedTone = detectOriginalTone(message);
    const fallbackData = () => ({
      originalDraft: message,
      rewrittenMessage: generateSmartFallback({ message, communicationType, recipient, tone: activeTone, subject }),
      originalTone: detectedTone,
      newTone: activeTone,
      improvements: getImprovements(message, detectedTone, activeTone),
      alternatives: generateAlternatives({ message, communicationType, recipient, currentTone: activeTone }),
    });

    let accumulated = "";
    setResult({ ...fallbackData(), rewrittenMessage: "", streaming: true });

    try {
      const res = await fetch("/api/rewrite/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, communicationType, recipient, tone: activeTone, subject }),
      });

      if (!res.ok) throw new Error(`Stream error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const json = part.slice(6);

          try {
            const event = JSON.parse(json);

            if (event.type === "token") {
              accumulated += event.content;
              const cleanMessage = extractPartialRewrittenMessage(accumulated);
              setResult((prev) => ({
                ...prev,
                rewrittenMessage: cleanMessage,
              }));
            } else if (event.type === "complete" && event.data) {
              setResult({
                originalDraft: message,
                rewrittenMessage: event.data.rewrittenMessage || accumulated || fallbackData().rewrittenMessage,
                originalTone: event.data.originalTone || detectedTone,
                newTone: event.data.newTone || activeTone,
                improvements: event.data.improvements || getImprovements(message, detectedTone, activeTone),
                alternatives:
                  event.data.alternatives ||
                  generateAlternatives({ message, communicationType, recipient, currentTone: activeTone }),
              });
              window.dispatchEvent(new Event("usage-updated"));
            } else if (event.type === "fallback" && event.data) {
              setResult({
                originalDraft: message,
                ...event.data,
              });
              window.dispatchEvent(new Event("usage-updated"));
            }
          } catch {
            // skip unparseable events
          }
        }
      }
    } catch {
      setResult(fallbackData());
      window.dispatchEvent(new Event("usage-updated"));
    } finally {
      setLoading(false);
    }
  };

  const handleUseVersion = (alt) => {
    setResult((prev) => ({ ...prev, rewrittenMessage: alt.preview, newTone: alt.tone }));
  };


  return (
    <div className="min-h-screen bg-surface-secondary">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start gap-3">
          <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Welcome back, {userName}!</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Let’s polish your drafts and write with confidence today.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
          <div className="rounded-xl border border-border bg-white p-5 shadow-soft lg:col-start-1 lg:col-end-2 flex flex-col h-full">
            <h2 className="mb-4 text-sm font-semibold text-text-primary">1. Your Message</h2>
            <RewriteForm onRewrite={handleRewrite} loading={loading} />
          </div>
          <div className="space-y-6 lg:col-start-2 lg:col-end-3 flex flex-col h-full">
            <div
              ref={resultRef}
              className="p-5 flex flex-col h-full gap-4 rounded-xl border border-border bg-white shadow-soft"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-primary">
                  2. Rewritten Version ({result?.newTone || "Professional"})
                </h2>
                <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-600 border border-green-100">
                  AI Generated
                </span>
              </div>
              <GeneratedMessage data={result} loading={loading} />
            </div>
            {result && !result.streaming && !loading && <ImprovementsCard improvements={result.improvements} />}
          </div>
          {loading && (
            <div className="lg:col-start-1 lg:col-end-3 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="skeleton h-4 w-44 rounded" />
                <div className="flex gap-1.5">
                  <div className="skeleton h-7 w-7 rounded-lg" />
                  <div className="skeleton h-7 w-7 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-white shadow-soft overflow-hidden flex flex-col h-36 border-t-2 border-slate-100 animate-pulse"
                  >
                    <div className="h-9 border-b border-border bg-slate-50/50 flex items-center justify-center">
                      <div className="h-3 w-20 rounded bg-slate-200" />
                    </div>
                    <div className="p-4 flex-1 space-y-2.5 flex flex-col justify-between">
                      <div className="h-2.5 w-full rounded bg-slate-200" />
                      <div className="h-2.5 w-5/6 rounded bg-slate-200" />
                      <div className="h-2.5 w-2/3 rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result && !result.streaming && !loading && (
            <div className="lg:col-start-1 lg:col-end-3">
              <AlternativeVersions alternatives={result.alternatives} onUseVersion={handleUseVersion} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
