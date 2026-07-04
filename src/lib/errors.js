export class AppError extends Error {
  constructor(message, { statusCode = 500, code = "INTERNAL_ERROR", cause } = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.cause = cause;
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      ...(process.env.NODE_ENV === "development" && { stack: this.stack }),
    };
  }
}

export class AuthError extends AppError {
  constructor(message = "Not authenticated.", cause) {
    super(message, { statusCode: 401, code: "NOT_AUTHENTICATED", cause });
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions.", cause) {
    super(message, { statusCode: 403, code: "FORBIDDEN", cause });
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found.", cause) {
    super(message, { statusCode: 404, code: "NOT_FOUND", cause });
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super("Too many requests. Please slow down.", {
      statusCode: 429,
      code: "RATE_LIMITED",
    });
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class ValidationError extends AppError {
  constructor(details = []) {
    super("Validation failed", { statusCode: 400, code: "VALIDATION_ERROR" });
    this.name = "ValidationError";
    this.details = details;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      details: this.details,
    };
  }
}

export class AIError extends AppError {
  constructor(message = "AI service unavailable.", cause) {
    super(message, { statusCode: 503, code: "AI_SERVICE_ERROR", cause });
    this.name = "AIError";
  }
}
