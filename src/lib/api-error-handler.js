import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { AppError, RateLimitError } from "./errors";

export function handleApiError(error) {
  Sentry.captureException(error, {
    extra: { source: "api" },
  });

  if (error instanceof AppError) {
    const headers = error instanceof RateLimitError ? { "Retry-After": String(error.retryAfter) } : {};
    return NextResponse.json(error.toJSON(), {
      status: error.statusCode,
      headers,
    });
  }

  console.error("Unhandled API error:", error);

  return NextResponse.json(
    {
      error: process.env.NODE_ENV === "development" ? error.message : "Server error",
      code: "INTERNAL_ERROR",
    },
    { status: 500 }
  );
}
