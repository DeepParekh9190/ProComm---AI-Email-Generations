"use client";

import { Mail, Hash, User, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const types = [
  { id: "email", label: "Email", icon: Mail },
  { id: "slack", label: "Slack Message", icon: Hash },
  { id: "client", label: "Client Message", icon: User },
  { id: "hr", label: "HR Discussion", icon: Users },
  { id: "performance", label: "Performance Feedback", icon: TrendingUp },
  { id: "escalation", label: "Escalation", icon: AlertTriangle },
];

export default function CommunicationTypeSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full">
      {types.map((t) => {
        const Icon = t.icon;
        const isActive = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border py-3 px-1 text-center transition-all min-h-[82px] cursor-pointer",
              isActive
                ? "border-brand-500 bg-brand-50 text-brand-600 font-semibold shadow-sm"
                : "border-border bg-white text-text-secondary hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <Icon className={cn("h-5 w-5 mb-1.5", isActive ? "text-brand-600" : "text-text-muted")} />
            <span className="text-[10px] font-semibold leading-tight tracking-tight px-0.5">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
