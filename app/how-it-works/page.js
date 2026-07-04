"use client";

import Link from "next/link";
import {
  Sparkles,
  MessageSquare,
  Shield,
  CheckCircle2,
  Layers,
  ArrowRight,
  ArrowLeft,
  PenTool,
  Check,
  RefreshCw,
  Copy,
  Download,
  Frown,
  Smile,
  Activity,
  MousePointer,
  Send,
  ListChecks,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useState } from "react";

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState("features");

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        <div className="text-center mb-10 relative">
          <div className="absolute inset-x-0 -top-12 -z-10 flex justify-center overflow-hidden blur-3xl opacity-20">
            <div className="aspect-[1155/678] w-[72rem] bg-gradient-to-tr from-brand-400 to-accent-600" />
          </div>
          <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-700/10 mb-4">
            AI-Powered Communication Assistant
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 bg-clip-text text-transparent">
            How ProComm Works
          </h1>
          <p className="mt-4 text-base leading-relaxed text-text-secondary max-w-2xl mx-auto">
            Transform raw, emotional, or unstructured drafts into clean, professional, and effective messages with the
            exact tone you need.
          </p>
        </div>
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("features")}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "features" ? "bg-white text-brand-600 shadow-sm border border-slate-200/50" : "text-text-secondary hover:text-text-primary"}`}
            >
              Features Overview
            </button>
            <button
              onClick={() => setActiveTab("workflow")}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "workflow" ? "bg-white text-brand-600 shadow-sm border border-slate-200/50" : "text-text-secondary hover:text-text-primary"}`}
            >
              Step-by-Step Workflow
            </button>
          </div>
        </div>
        {activeTab === "features" ? (
          <div className="space-y-16 animate-fade-in">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-center">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 shadow-sm">
                  <PenTool className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Section 1</span>
                <h2 className="text-2xl font-bold tracking-tight text-text-primary">1. Enter Your Message</h2>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Begin by drafting your email, message, topic, or feedback in the input panel. To align the AI rewrite
                  to your exact business context, you can customize the options:
                </p>
                <ul className="space-y-2.5 text-xs font-medium text-text-secondary">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    <span>
                      <strong>Communication Type:</strong> Select Email, Slack message, Performance feedback, etc.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    <span>
                      <strong>Recipient Context:</strong> Choose colleague, manager, client, partner, or custom.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    <span>
                      <strong>Desired Tone:</strong> Select preset tones or type in a completely custom tone.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-white p-6 shadow-soft space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="text-[11px] font-bold text-slate-400 ml-2">YOUR INPUT DRAFT</span>
                </div>
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-500">Desired Tone</div>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-slate-500">
                      Firm
                    </span>
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-brand-50 border border-brand-200 text-brand-600 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Custom (Sarcastic)
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-500">Your Draft</div>
                  <div className="p-3 bg-slate-50 rounded-lg text-xs leading-relaxed text-slate-700 font-medium">
                    "This is the third time you forgot to attach the report."
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-center">
              <div className="space-y-4 lg:col-start-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                  <Shield className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Section 2</span>
                <h2 className="text-2xl font-bold tracking-tight text-text-primary">2. Rewrite Safely with AI</h2>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Clicking <strong>"Rewrite Safely"</strong> runs the AI core engine to translate your raw message into
                  a clean version that retains your original points but structures them in the desired tone.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                    <Copy className="h-3.5 w-3.5 text-slate-400" /> Copy
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                    <RefreshCw className="h-3.5 w-3.5 text-slate-400" /> Regenerate
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                    <Download className="h-3.5 w-3.5 text-slate-400" /> Download
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-6 shadow-soft space-y-4 lg:col-start-1 lg:row-start-1">
                <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                      <Frown className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Detected</div>
                      <div className="text-xs font-bold text-slate-800">Aggressive</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500">
                      <Smile className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">New Tone</div>
                      <div className="text-xs font-bold text-slate-800">Sarcastic</div>
                    </div>
                  </div>
                </div>
                <div className="p-3 border border-emerald-100 bg-emerald-50/20 rounded-lg text-xs leading-relaxed text-slate-700 font-medium">
                  "Hi, I noticed the report was missing from your message. I hope this was just to test if I was paying
                  attention! Please attach it when you get a chance."
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-center">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Section 3</span>
                <h2 className="text-2xl font-bold tracking-tight text-text-primary">3. Improvements Made by AI</h2>
                <p className="text-sm leading-relaxed text-text-secondary">
                  The AI highlights the specific adjustments it applied to make your draft ready for sending.
                </p>
                <ul className="space-y-3.5">
                  <li className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span className="text-xs text-text-secondary">
                      Replaces passive-aggressive comments with objective and constructive suggestions.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span className="text-xs text-text-secondary">
                      Removes high-pressure demands, replacing them with professional action items.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span className="text-xs text-text-secondary">
                      Corrects grammatical errors, typos, and syntax flow.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-white p-6 shadow-soft space-y-3.5">
                <h4 className="text-xs font-bold text-slate-800">3. Improvements Made</h4>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <div className="mt-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span>Substituted confrontational phrases with constructive dialogue</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <div className="mt-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span>Removed exclamation marks and high-pressure words</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <div className="mt-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span>Replaced subjective complaints with objective statements</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-center">
              <div className="space-y-4 lg:col-start-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 shadow-sm">
                  <Layers className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Section 4</span>
                <h2 className="text-2xl font-bold tracking-tight text-text-primary">4. Alternative Versions</h2>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Communication is rarely one-size-fits-all. The <strong>Alternative Versions</strong> grid
                  automatically lists three variations of your message written in other tones.
                </p>
                <p className="text-sm leading-relaxed text-text-secondary">
                  You can review each variation and click any card to instantly make it your active draft.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-white p-6 shadow-soft space-y-3.5 lg:col-start-1 lg:row-start-1">
                <h4 className="text-xs font-bold text-slate-800">4. Alternative Versions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-[10px] leading-relaxed text-slate-600">
                    <div className="font-bold text-purple-700 text-xs mb-1">Diplomatic</div>
                    "Hi, I hope you're doing well. It looks like the report got left off the attachment..."
                  </div>
                  <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-[10px] leading-relaxed text-slate-600">
                    <div className="font-bold text-red-700 text-xs mb-1">Firm</div>
                    "Please ensure you attach the required report immediately. This is the third omission..."
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative border-l border-slate-200 pl-8 ml-4 space-y-12 animate-fade-in">
            <div className="relative">
              <span className="absolute -left-12 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold ring-4 ring-white shadow-sm">
                1
              </span>
              <div className="space-y-2 bg-white rounded-xl border border-border p-5 shadow-soft">
                <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-wide">
                  <PenTool className="h-3.5 w-3.5" /> Input Phase
                </div>
                <h3 className="text-lg font-bold text-text-primary">Step 1: User Inputs the Message</h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  The user enters their email, message, draft, topic, or communication content in the{" "}
                  <strong>"Your Message"</strong> section. In this phase, you select options to specify target context.
                </p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute -left-12 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold ring-4 ring-white shadow-sm">
                2
              </span>
              <div className="space-y-2 bg-white rounded-xl border border-border p-5 shadow-soft">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wide">
                  <Activity className="h-3.5 w-3.5" /> Tone Diagnostics
                </div>
                <h3 className="text-lg font-bold text-text-primary">Step 2: AI Analyzes the Original Message</h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  The AI reads the submitted content immediately before rewriting to diagnose the original tone and
                  context.
                </p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute -left-12 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold ring-4 ring-white shadow-sm">
                3
              </span>
              <div className="space-y-2 bg-white rounded-xl border border-border p-5 shadow-soft">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wide">
                  <MousePointer className="h-3.5 w-3.5" /> CTA Trigger
                </div>
                <h3 className="text-lg font-bold text-text-primary">Step 3: User Clicks "Rewrite Safely"</h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  The user triggers the transformation by clicking the main call-to-action button.
                </p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute -left-12 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold ring-4 ring-white shadow-sm">
                4
              </span>
              <div className="space-y-2 bg-white rounded-xl border border-border p-5 shadow-soft">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wide">
                  <Sparkles className="h-3.5 w-3.5" /> AI Engine core
                </div>
                <h3 className="text-lg font-bold text-text-primary">Step 4: AI Rewrites the Content</h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  The core engine transforms the text: maintaining your core points, cleaning hostile structures, and
                  wrapping everything inside your chosen desired tone.
                </p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute -left-12 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold ring-4 ring-white shadow-sm">
                5
              </span>
              <div className="space-y-2 bg-white rounded-xl border border-border p-5 shadow-soft">
                <div className="flex items-center gap-2 text-teal-600 font-bold text-xs uppercase tracking-wide">
                  <MessageSquare className="h-3.5 w-3.5" /> Outputs
                </div>
                <h3 className="text-lg font-bold text-text-primary">Step 5: Display Rewritten Version</h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  The output appears showing the detected original tone and the new tone, containing the clean text
                  block.
                </p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute -left-12 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold ring-4 ring-white shadow-sm">
                6
              </span>
              <div className="space-y-2 bg-white rounded-xl border border-border p-5 shadow-soft">
                <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-wide">
                  <ListChecks className="h-3.5 w-3.5" /> Adjustments
                </div>
                <h3 className="text-lg font-bold text-text-primary">Step 6: Show Improvements Made</h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  The AI displays a checklist showing exactly what it replaced or fixed.
                </p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute -left-12 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold ring-4 ring-white shadow-sm">
                7
              </span>
              <div className="space-y-2 bg-white rounded-xl border border-border p-5 shadow-soft">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wide">
                  <Layers className="h-3.5 w-3.5" /> Variants
                </div>
                <h3 className="text-lg font-bold text-text-primary">Step 7: Generate Alternative Versions</h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  AI renders additional versions of your draft in secondary tones to ensure you have choices.
                </p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute -left-12 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold ring-4 ring-white shadow-sm">
                8
              </span>
              <div className="space-y-2 bg-white rounded-xl border border-border p-5 shadow-soft">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wide">
                  <Send className="h-3.5 w-3.5" /> Send Phase
                </div>
                <h3 className="text-lg font-bold text-text-primary">
                  Step 8: User Selects and Uses the Preferred Version
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Review the options, pick your favorite version, copy or download it, and send it with confidence.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="mt-20 rounded-3xl bg-gradient-to-r from-brand-600 via-brand-700 to-accent-600 p-8 sm:p-12 text-center text-white shadow-elevated relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.05] -z-10" />
          <h2 className="text-2xl font-extrabold sm:text-3xl">Ready to communicate with absolute confidence?</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-brand-100 leading-relaxed">
            Protect your workplace relationships, keep your messages professional, and ensure every communication hits
            the perfect tone.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-brand-700 shadow-md transition-all hover:bg-brand-50 cursor-pointer hover:scale-[1.02]"
            >
              Start Writing Safely Now
              <ArrowRight className="h-4 w-4 text-brand-700" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
