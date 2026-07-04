"use client";

import { useState, useEffect, memo } from "react";
import { Sparkles, Info } from "lucide-react";
import CommunicationTypeSelector from "./CommunicationTypeSelector";
import RecipientSelector from "./RecipientSelector";
import ToneSelector from "./ToneSelector";

export default memo(function RewriteForm({ onRewrite, loading }) {
  const [commType, setCommType] = useState("email");
  const [recipient, setRecipient] = useState("Employee");
  const [tone, setTone] = useState("Professional");
  const [subject, setSubject] = useState("");
  const [draft, setDraft] = useState("");

  const [isMac, setIsMac] = useState(false);
  const charLimit = 5000;
  const chars = draft.length;

  useEffect(() => {
    setIsMac(navigator.platform.includes("Mac"));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!draft.trim() || loading) return;
    onRewrite({ message: draft, communicationType: commType, recipient, tone, subject });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (draft.trim() && !loading) {
          onRewrite({ message: draft, communicationType: commType, recipient, tone, subject });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [draft, commType, recipient, tone, subject, loading, onRewrite]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 h-full flex-1 justify-between">
      {/* Communication Type */}
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <label className="text-sm font-semibold text-text-primary">Communication Type</label>
          <div className="group relative flex items-center">
            <Info className="h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 ease-out rounded-lg bg-slate-900 px-3 py-2 text-xs font-normal leading-normal text-white shadow-xl">
              Select the platform where you will send this message to apply custom layout and formatting styles.
              <div className="absolute top-full left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-0.75 bg-slate-900 rotate-45" />
            </div>
          </div>
        </div>
        <CommunicationTypeSelector value={commType} onChange={setCommType} />
      </div>

      {/* Recipient */}
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <label className="text-sm font-semibold text-text-primary">Recipient</label>
          <div className="group relative flex items-center">
            <Info className="h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 ease-out rounded-lg bg-slate-900 px-3 py-2 text-xs font-normal leading-normal text-white shadow-xl">
              Specify the recipient of your message to refine greetings, pronouns, and general professional boundaries.
              <div className="absolute top-full left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-0.75 bg-slate-900 rotate-45" />
            </div>
          </div>
        </div>
        <RecipientSelector value={recipient} onChange={setRecipient} />
      </div>

      {/* Desired Tone */}
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <label className="text-sm font-semibold text-text-primary">Desired Tone</label>
          <div className="group relative flex items-center">
            <Info className="h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 ease-out rounded-lg bg-slate-900 px-3 py-2 text-xs font-normal leading-normal text-white shadow-xl">
              Select the target tone for the rewrite. You can also specify custom descriptors below.
              <div className="absolute top-full left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-0.75 bg-slate-900 rotate-45" />
            </div>
          </div>
        </div>
        <ToneSelector value={tone} onChange={setTone} />
      </div>

      {/* Subject Line */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-primary">
          Subject Line <span className="font-normal text-text-secondary text-xs">(optional)</span>
        </label>
        <input
          id="input-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter subject line..."
          className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {/* Your Draft */}
      <div className="space-y-2 flex-1 flex flex-col min-h-45">
        <label className="block text-sm font-semibold text-text-primary">Your Draft</label>
        <div className="relative flex-1 flex flex-col">
          <textarea
            id="input-draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste your email, message, feedback, or communication draft here..."
            maxLength={charLimit}
            className="w-full flex-1 resize-none rounded-lg border border-border bg-white px-3.5 py-3 pb-8 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 min-h-35"
          />
          <div className="absolute bottom-2.5 right-3.5 text-[11px] text-text-muted font-medium">
            {chars} / {charLimit}
          </div>
        </div>
      </div>

      {/* Submit CTA */}
      <div className="flex items-center gap-3">
        <button
          id="btn-rewrite-submit"
          type="submit"
          disabled={!draft.trim() || loading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg py-3.5 px-4 text-sm font-semibold text-white transition-all shadow-sm cursor-pointer bg-linear-to-r from-brand-600 to-accent-600 hover:from-brand-700 hover:to-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "Rewriting Safely..." : "Rewrite Safely"}
        </button>
        <span className="hidden sm:inline text-[11px] text-text-muted font-medium whitespace-nowrap">
          {isMac ? "⌘" : "Ctrl"}+Enter
        </span>
      </div>
    </form>
  );
});
