"use client";

import { memo } from "react";
import { Check } from "lucide-react";

const defaultImprovements = [
  "Reduced emotionally charged wording",
  "Improved clarity and structure",
  "Added professional and constructive language",
  "Reduced likelihood of misinterpretation",
];

export default memo(function ImprovementsCard({ improvements = defaultImprovements }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-soft">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">3. Improvements Made</h3>

      <div className="flex items-center justify-between gap-6">
        {/* Checklist */}
        <div className="space-y-3.5 flex-1">
          {improvements.map((imp, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-[#DEF7EC] text-[#03543F]">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
              <span className="text-sm font-medium text-text-secondary">{imp}</span>
            </div>
          ))}
        </div>

        {/* Custom SVG Illustration */}
        <div className="hidden sm:block flex-shrink-0">
          <svg width="110" height="110" viewBox="0 0 110 110" fill="none" className="h-28 w-28">
            {/* Sparkles / Dots */}
            <circle cx="85" cy="18" r="2.5" fill="#A855F7" opacity="0.6" />
            <path d="M92 34l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" fill="#C084FC" />

            {/* Document sheet */}
            <rect x="20" y="15" width="56" height="74" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
            {/* Text lines in document */}
            <line x1="32" y1="32" x2="62" y2="32" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" />
            <line x1="32" y1="44" x2="52" y2="44" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" />
            <line x1="32" y1="56" x2="58" y2="56" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" />

            {/* Big check mark badge at bottom right */}
            <circle cx="78" cy="74" r="18" fill="#3B82F6" />
            <path d="M71 74l5 5 8-8" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
});
