import React from "react";

export default function Logo({ width = 24, height = 24, className = "text-brand-600" }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Paper Plane */}
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
      {/* Trailing Sparkles */}
      <path d="M5 14L4.5 15.5L3 16L4.5 16.5L5 18L5.5 16.5L7 16L5.5 15.5Z" fill="currentColor" stroke="none" />
      <path d="M9 18L8.7 19.2L7.7 19.5L8.7 19.8L9 21L9.3 19.8L10.3 19.5L9.3 19.2Z" fill="currentColor" stroke="none" />
      <path d="M15 15L14.8 15.8L14 16L14.8 16.2L15 17L15.2 16.2L16 16L15.2 15.8Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
