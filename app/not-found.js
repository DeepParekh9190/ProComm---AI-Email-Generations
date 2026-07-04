"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 border border-red-100 shadow-sm">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-bold text-slate-800">Page Not Found</h2>
      <p className="mt-1.5 text-sm text-slate-500 max-w-sm leading-relaxed">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition-colors shadow-sm cursor-pointer"
      >
        Go back home
      </Link>
    </div>
  );
}
