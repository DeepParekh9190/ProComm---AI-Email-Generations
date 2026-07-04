"use client";

import { useState, useEffect, memo } from "react";
import { ChevronLeft, ChevronRight, Briefcase, Feather, Shield, Heart, Info, Zap } from "lucide-react";

const toneMeta = {
  Professional: {
    color: "text-blue-700",
    bgColor: "bg-blue-50/50",
    borderColor: "border-t-2 border-blue-600",
    icon: Briefcase,
  },
  Diplomatic: {
    color: "text-purple-700",
    bgColor: "bg-purple-50/50",
    borderColor: "border-t-2 border-purple-600",
    icon: Feather,
  },
  Firm: {
    color: "text-red-700",
    bgColor: "bg-red-50/50",
    borderColor: "border-t-2 border-red-600",
    icon: Shield,
  },
  Empathetic: {
    color: "text-emerald-700",
    bgColor: "bg-emerald-50/50",
    borderColor: "border-t-2 border-emerald-600",
    icon: Heart,
  },
  Neutral: {
    color: "text-slate-700",
    bgColor: "bg-slate-50/50",
    borderColor: "border-t-2 border-slate-600",
    icon: Info,
  },
};

export default memo(function AlternativeVersions({ alternatives = [], onUseVersion }) {
  const [startIndex, setStartIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640); // 640px matches tailwind 'sm' breakpoint
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset starting index whenever a new set of alternatives is generated
  useEffect(() => {
    setStartIndex(0);
  }, [alternatives]);

  const maxIndex = Math.max(0, alternatives.length - (isMobile ? 1 : 3));
  const canPrev = startIndex > 0;
  const canNext = startIndex < maxIndex;

  const handlePrev = () => {
    if (canPrev) {
      setStartIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (canNext) {
      setStartIndex((prev) => prev + 1);
    }
  };

  const visibleAlternatives = alternatives.slice(startIndex, startIndex + (isMobile ? 1 : 3));

  return (
    <div className="space-y-4">
      {/* Header with Arrows */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">4. Alternative Versions</h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canPrev}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-white text-slate-400 transition-all hover:bg-slate-50 cursor-pointer ${
              !canPrev ? "opacity-30 cursor-not-allowed bg-slate-50" : ""
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canNext}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-white text-slate-400 transition-all hover:bg-slate-50 cursor-pointer ${
              !canNext ? "opacity-30 cursor-not-allowed bg-slate-50" : ""
            }`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Alternatives Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {visibleAlternatives.map((alt, i) => {
          const meta = toneMeta[alt.tone] || {
            color: "text-slate-700",
            bgColor: "bg-slate-50",
            borderColor: "border-t-2 border-slate-500",
            icon: Briefcase,
          };
          const Icon = meta.icon;

          return (
            <div
              key={startIndex + i}
              onClick={() => onUseVersion && onUseVersion(alt)}
              className={`group flex flex-col rounded-xl border border-border bg-white shadow-soft transition-all hover:shadow-card hover:border-slate-300 cursor-pointer ${meta.borderColor}`}
            >
              {/* Card Header */}
              <div
                className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b border-border rounded-t-lg ${meta.bgColor} ${meta.color}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{alt.tone}</span>
              </div>
              {/* Card Body */}
              <div className="flex-1 p-4 flex flex-col justify-between gap-3">
                <p className="text-xs leading-relaxed text-text-secondary whitespace-pre-wrap">{alt.preview}</p>
                <div className="mt-auto pt-2 border-t border-slate-50 flex items-center justify-end text-[10px] font-bold text-brand-600 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
                  <span className="flex items-center gap-1 bg-brand-50/70 px-2 py-1 rounded">
                    <Zap className="h-3 w-3 text-brand-600 fill-brand-600" />
                    <span>Use Version</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
