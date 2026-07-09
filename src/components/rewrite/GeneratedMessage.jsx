"use client";

import { useState, useEffect, useRef, memo } from "react";
import { Copy, Check, Frown, Smile, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Robust LCS Word Diffing helper
function diffWords(original = "", rewritten = "") {
  const origWords = original.split(/(\s+)/).filter(Boolean);
  const newWords = rewritten.split(/(\s+)/).filter(Boolean);

  const dp = Array(origWords.length + 1)
    .fill(null)
    .map(() => Array(newWords.length + 1).fill(0));

  for (let i = 1; i <= origWords.length; i++) {
    for (let j = 1; j <= newWords.length; j++) {
      if (origWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = origWords.length;
  let j = newWords.length;
  const result = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origWords[i - 1] === newWords[j - 1]) {
      result.unshift({ type: "unchanged", value: origWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "added", value: newWords[j - 1] });
      j--;
    } else {
      result.unshift({ type: "removed", value: origWords[i - 1] });
      i--;
    }
  }

  return result;
}

export default memo(function GeneratedMessage({ data, loading }) {
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const wasStreamingRef = useRef(false);

  const isStreaming = data?.streaming;

  // Typewriter Effect (skip when streaming — parent sends progressive tokens)
  useEffect(() => {
    if (isStreaming || !data?.rewrittenMessage || loading) {
      if (isStreaming) {
        setDisplayedText(data?.rewrittenMessage || "");
        setIsTyping(false);
        wasStreamingRef.current = true;
      } else {
        setDisplayedText("");
        setIsTyping(false);
      }
      return;
    }

    if (wasStreamingRef.current) {
      wasStreamingRef.current = false;
      return;
    }

    const fullText = data.rewrittenMessage;
    setIsTyping(true);
    setDisplayedText("");

    const tokens = fullText.split(/(\s+)/).filter(Boolean);
    let currentTokenIndex = 0;
    let currentText = "";

    const timer = setInterval(() => {
      if (currentTokenIndex < tokens.length) {
        currentText += tokens[currentTokenIndex];
        setDisplayedText(currentText);
        currentTokenIndex++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, 20);

    return () => {
      clearInterval(timer);
    };
  }, [data?.rewrittenMessage, loading, isStreaming]);

  const handleSkipTyping = () => {
    if (isTyping && data?.rewrittenMessage) {
      setDisplayedText(data.rewrittenMessage);
      setIsTyping(false);
    }
  };

  if (!data && !loading) {
    return (
      <div className="flex flex-1 w-full flex-col items-center justify-center rounded-xl border border-border bg-white p-8 text-center min-h-[260px]">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50">
          <RefreshCw className="h-6 w-6 text-brand-400" />
        </div>
        <h3 className="text-base font-semibold text-text-primary">Waiting for your message</h3>
        <p className="mt-1 text-sm text-text-muted">
          Fill in the details and click Rewrite Safely to see the AI-generated version here.
        </p>
      </div>
    );
  }

  if (loading && (!data || !data.rewrittenMessage)) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center gap-4">
          <div className="skeleton h-[68px] flex-1 rounded-xl" />
          <div className="skeleton h-4 w-6 rounded" />
          <div className="skeleton h-[68px] flex-1 rounded-xl" />
        </div>
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-3">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
          <div className="skeleton h-4 w-2/3 rounded" />
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.rewrittenMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy text:", e);
    }
  };

  const diffResult = showDiff ? diffWords(data.originalDraft || "", data.rewrittenMessage || "") : null;


  return (
    <div className="animate-fade-in space-y-5">
      {/* Style blocks for keyframe animations */}
      <style>{`

        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .typewriter-cursor {
          display: inline-block;
          width: 2.5px;
          height: 1.1em;
          background-color: var(--color-brand-600, #2563eb);
          margin-left: 2px;
          vertical-align: middle;
          animation: cursorBlink 0.8s step-end infinite;
        }
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translate(-50%, 1rem);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-up-fade {
          animation: slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Side-by-Side Tone Comparison */}
      <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4">
        {/* Original Tone Box */}
        <div className="flex flex-1 items-center gap-3 sm:gap-4 rounded-xl border border-border bg-white px-4 sm:px-5 py-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
            <Frown className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Original Tone</p>
            <p className="mt-1 text-sm font-bold text-text-primary">{data.originalTone || "Aggressive"}</p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex flex-shrink-0 items-center">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-400"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>

        {/* New Tone Box */}
        <div className="flex flex-1 items-center gap-3 sm:gap-4 rounded-xl border border-border bg-white px-4 sm:px-5 py-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-green-50 text-green-500">
            <Smile className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">New Tone</p>
            <p className="mt-1 text-sm font-bold text-text-primary">{data.newTone || "Professional"}</p>
          </div>
        </div>
      </div>

      {/* Compare Header and Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
          Output Message
        </span>
      </div>

      {/* Rewritten Text Box */}
      <div
        onClick={isStreaming ? undefined : handleSkipTyping}
        className={cn(
          "relative rounded-xl border border-border bg-white shadow-sm p-5 min-h-[160px] transition-all duration-500 ease-out",
          isTyping && "cursor-pointer hover:border-slate-300"
        )}
      >
        {isTyping && !isStreaming && (
          <div className="absolute bottom-2.5 right-3.5 text-[10px] text-text-muted font-medium select-none pointer-events-none animate-pulse">
            Click card to skip typing
          </div>
        )}

        {showDiff ? (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-[13.5px] leading-relaxed text-text-primary">
            {diffResult.map((part, index) => {
              if (part.type === "added") {
                return (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 px-0.5 rounded font-medium border-b border-green-300 transition-colors"
                  >
                    {part.value}
                  </span>
                );
              }
              if (part.type === "removed") {
                return (
                  <span
                    key={index}
                    className="bg-red-50 text-red-700 line-through px-0.5 rounded opacity-75 decoration-red-400 transition-colors"
                  >
                    {part.value}
                  </span>
                );
              }
              return <span key={index}>{part.value}</span>;
            })}
          </div>
        ) : (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-[13.5px] leading-relaxed text-text-primary">
            {isTyping ? displayedText : (data.rewrittenMessage || (
              <span className="flex items-center gap-2 text-gray-400 select-none">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-500" />
                Preparing draft...
              </span>
            ))}
            {isTyping && <span className="typewriter-cursor" />}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          disabled={isTyping}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold shadow-sm transition-all",
            isTyping
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : copied
                ? "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                : "bg-brand-600 text-white hover:bg-brand-700 cursor-pointer"
          )}
        >
          {isTyping ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Writing...</span>
            </>
          ) : (
            <>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </>
          )}
        </button>
      </div>

      {/* Premium Copy Toast Notification */}
      {copied && (
        <div className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2.5 rounded-full bg-slate-900/95 backdrop-blur-md px-4.5 py-3 text-xs font-semibold text-white shadow-2xl border border-slate-800 animate-slide-up-fade">
          <Check className="h-4 w-4 text-emerald-400 stroke-[3]" />
          <span>Copied to clipboard!</span>
        </div>
      )}
    </div>
  );
});
