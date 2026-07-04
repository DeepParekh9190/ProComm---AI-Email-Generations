"use client";

import { useState, useEffect } from "react";
import { Briefcase, Handshake, Shield, Heart, Circle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const presets = [
  { id: "Professional", label: "Professional", icon: Briefcase },
  { id: "Diplomatic", label: "Diplomatic", icon: Handshake },
  { id: "Firm", label: "Firm", icon: Shield },
  { id: "Empathetic", label: "Empathetic", icon: Heart },
  { id: "Neutral", label: "Neutral", icon: Circle },
];

const toneStyles = {
  Professional: {
    active: "border-blue-500 bg-blue-50/50 text-blue-700 shadow-sm",
    hover: "hover:border-blue-200 hover:bg-blue-50/10",
    iconColor: "text-blue-600",
  },
  Diplomatic: {
    active: "border-purple-500 bg-purple-50/50 text-purple-700 shadow-sm",
    hover: "hover:border-purple-200 hover:bg-purple-50/10",
    iconColor: "text-purple-600",
  },
  Firm: {
    active: "border-red-500 bg-red-50/50 text-red-700 shadow-sm",
    hover: "hover:border-red-200 hover:bg-red-50/10",
    iconColor: "text-red-600",
  },
  Empathetic: {
    active: "border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-sm",
    hover: "hover:border-emerald-200 hover:bg-emerald-50/10",
    iconColor: "text-emerald-600",
  },
  Neutral: {
    active: "border-slate-500 bg-slate-50/50 text-slate-700 shadow-sm",
    hover: "hover:border-slate-200 hover:bg-slate-50/10",
    iconColor: "text-slate-600",
  },
  Custom: {
    active: "border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-sm",
    hover: "hover:border-indigo-200 hover:bg-indigo-50/10",
    iconColor: "text-indigo-600",
  },
};

export default function ToneSelector({ value, onChange }) {
  const isPreset = presets.some((p) => p.id === value);
  const [customVal, setCustomVal] = useState(isPreset ? "" : value);
  const [showInput, setShowInput] = useState(!isPreset && value !== "");

  // Update custom input if value changes externally
  useEffect(() => {
    if (!isPreset && value) {
      setCustomVal(value);
      setShowInput(true);
    } else if (isPreset) {
      setShowInput(false);
    }
  }, [value, isPreset]);

  const handlePresetClick = (id) => {
    setShowInput(false);
    onChange(id);
  };

  const handleCustomClick = () => {
    setShowInput(true);
    onChange(customVal || "Custom");
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setCustomVal(val);
    onChange(val || "Custom");
  };

  return (
    <div className="space-y-3 w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
        {presets.map((p) => {
          const Icon = p.icon;
          const isActive = value === p.id;
          const style = toneStyles[p.id];
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetClick(p.id)}
              className={cn(
                "flex items-center justify-start gap-2 rounded-lg border py-2.5 px-3 text-xs transition-all font-semibold cursor-pointer w-full",
                isActive ? style.active : cn("border-border bg-white text-text-secondary", style.hover)
              )}
            >
              <span className="shrink-0">
                <Icon className={cn("h-4 w-4", isActive ? style.iconColor : "text-text-muted")} />
              </span>
              <span className="flex-1 text-left">{p.label}</span>
            </button>
          );
        })}
        {/* Custom Option */}
        <button
          id="btn-tone-custom"
          type="button"
          onClick={handleCustomClick}
          className={cn(
            "flex items-center justify-start gap-2 rounded-lg border py-2.5 px-3 text-xs transition-all font-semibold cursor-pointer w-full",
            showInput
              ? toneStyles.Custom.active
              : cn("border-border bg-white text-text-secondary", toneStyles.Custom.hover)
          )}
        >
          <span className="shrink-0">
            <Sparkles className={cn("h-4 w-4", showInput ? toneStyles.Custom.iconColor : "text-text-muted")} />
          </span>
          <span className="flex-1 text-left">Custom...</span>
        </button>
      </div>

      {showInput && (
        <div className="relative animate-fade-in">
          <input
            id="input-custom-tone"
            type="text"
            value={customVal === "Custom" ? "" : customVal}
            onChange={handleInputChange}
            placeholder="Type your custom tone (e.g. Sarcastic, Witty, Apologetic)..."
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      )}
    </div>
  );
}
