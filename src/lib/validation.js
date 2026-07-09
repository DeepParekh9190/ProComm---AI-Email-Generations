const ALLOWED_TONES = ["Professional", "Diplomatic", "Firm", "Empathetic", "Neutral"];
const ALLOWED_COMM_TYPES = ["email", "slack", "client", "hr", "performance", "escalation"];
const ALLOWED_RECIPIENTS = ["Employee", "Manager", "Client", "Vendor", "Partner"];

const MAX_MESSAGE_LENGTH = 10000;
const MAX_SUBJECT_LENGTH = 500;
const MAX_NAME_LENGTH = 100;
const MAX_STRING_LENGTH = 500;

export function sanitizeString(input) {
  if (typeof input !== "string") return "";
  const trimmed = input.trim().slice(0, MAX_MESSAGE_LENGTH);
  return trimmed
    .replace(/<[^>]*>/g, "")
    .replace(/[\\<>]/g, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

export function sanitizeSubject(input) {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .slice(0, MAX_SUBJECT_LENGTH)
    .replace(/<[^>]*>/g, "")
    .replace(/[\\<>]/g, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

export function validateRewriteInput(body) {
  const errors = [];

  if (!body.message || typeof body.message !== "string" || body.message.trim().length === 0) {
    errors.push("message is required and must be a non-empty string");
  } else if (body.message.length > MAX_MESSAGE_LENGTH) {
    errors.push(`message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`);
  }

  if (body.tone && !ALLOWED_TONES.includes(body.tone)) {
    errors.push(`tone must be one of: ${ALLOWED_TONES.join(", ")}`);
  }

  if (body.communicationType && !ALLOWED_COMM_TYPES.includes(body.communicationType)) {
    errors.push(`communicationType must be one of: ${ALLOWED_COMM_TYPES.join(", ")}`);
  }

  if (body.recipient && !ALLOWED_RECIPIENTS.includes(body.recipient)) {
    errors.push(`recipient must be one of: ${ALLOWED_RECIPIENTS.join(", ")}`);
  }

  if (body.subject && typeof body.subject === "string" && body.subject.length > MAX_SUBJECT_LENGTH) {
    errors.push(`subject exceeds maximum length of ${MAX_SUBJECT_LENGTH} characters`);
  }

  if (body.model && typeof body.model === "string" && body.model.length > 200) {
    errors.push("model exceeds maximum length");
  }

  return errors;
}

export function sanitizeAdminInput(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_STRING_LENGTH).replace(/[<>]/g, "");
}

export function validatePrice(value) {
  if (typeof value !== "string") return false;
  return /^\$\d+(\.\d{2})?$/.test(value);
}

export function validatePeriod(value) {
  const allowed = ["/month", "/year", "/week", "/quarter"];
  return allowed.includes(value);
}

export function validateFeatures(value) {
  if (!Array.isArray(value)) return false;
  return value.every(f => typeof f === "string" && f.length <= 200);
}

export function validateModelId(value) {
  if (typeof value !== "string") return false;
  return value.length > 0 && value.length <= 300;
}

export function validateName(value) {
  if (typeof value !== "string") return false;
  return value.trim().length > 0 && value.length <= MAX_NAME_LENGTH;
}

export function validateRole(value) {
  return value === "user" || value === "admin";
}
