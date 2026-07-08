"use client";

import { User, Briefcase, Store, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const recipients = [
  { id: "Employee", label: "Employee", icon: User },
  { id: "Manager", label: "Manager", icon: User },
  { id: "Client", label: "Client", icon: Briefcase },
  { id: "Vendor", label: "Vendor", icon: Store },
  { id: "Partner", label: "Partner", icon: Heart },
];

export default function RecipientSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 w-full">
      {recipients.map((r) => {
        const Icon = r.icon;
        const isActive = value === r.id;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onChange(r.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg border py-2.5 px-1 text-xs transition-all font-semibold cursor-pointer w-full text-center",
              isActive
                ? "border-brand-500 bg-brand-50 text-brand-600 shadow-sm"
                : "border-border bg-white text-text-secondary hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", isActive ? "text-brand-600" : "text-text-muted")} />
            <span>{r.label}</span>
          </button>
        );
      })}
    </div>
  );
}
