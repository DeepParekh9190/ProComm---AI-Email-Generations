/* eslint-disable @typescript-eslint/no-require-imports */
const { sanitizeString, sanitizeSubject, validateRewriteInput } = require("./validation");

describe("sanitizeString", () => {
  it("returns empty string for non-string input", () => {
    expect(sanitizeString(null)).toBe("");
    expect(sanitizeString(undefined)).toBe("");
    expect(sanitizeString(123)).toBe("");
    expect(sanitizeString({})).toBe("");
  });

  it("trims whitespace from input", () => {
    expect(sanitizeString("  hello world  ")).toBe("hello world");
  });

  it("slices input to maximum message length", () => {
    const longStr = "a".repeat(10005);
    expect(sanitizeString(longStr)).toHaveLength(10000);
  });

  it("removes HTML tags", () => {
    expect(sanitizeString("hello <script>alert('xss')</script> world")).toBe("hello alert('xss') world");
    expect(sanitizeString("<div>test</div>")).toBe("test");
  });

  it("removes backslash and angle brackets", () => {
    expect(sanitizeString("hello \\ world < >")).toBe("hello  world ");
  });
});

describe("sanitizeSubject", () => {
  it("returns empty string for non-string input", () => {
    expect(sanitizeSubject(null)).toBe("");
    expect(sanitizeSubject(123)).toBe("");
  });

  it("trims whitespace", () => {
    expect(sanitizeSubject("   subject line   ")).toBe("subject line");
  });

  it("slices input to maximum subject length (500)", () => {
    const longStr = "s".repeat(505);
    expect(sanitizeSubject(longStr)).toHaveLength(500);
  });

  it("removes HTML tags and angle brackets/backslashes", () => {
    expect(sanitizeSubject("<script>XSS</script>\\")).toBe("XSS");
  });
});

describe("validateRewriteInput", () => {
  it("returns error if message is missing, empty, or not a string", () => {
    expect(validateRewriteInput({})).toContain("message is required and must be a non-empty string");
    expect(validateRewriteInput({ message: "" })).toContain("message is required and must be a non-empty string");
    expect(validateRewriteInput({ message: "   " })).toContain("message is required and must be a non-empty string");
    expect(validateRewriteInput({ message: 123 })).toContain("message is required and must be a non-empty string");
  });

  it("returns error if message exceeds maximum length", () => {
    const longStr = "a".repeat(10001);
    const errors = validateRewriteInput({ message: longStr });
    expect(errors.some(e => e.includes("message exceeds maximum length"))).toBe(true);
  });

  it("returns error if tone is invalid", () => {
    const errors = validateRewriteInput({ message: "Hello", tone: "Sarcastic" });
    expect(errors.some(e => e.includes("tone must be one of"))).toBe(true);
  });

  it("does not return error if tone is valid", () => {
    const errors = validateRewriteInput({ message: "Hello", tone: "Professional" });
    expect(errors).toHaveLength(0);
  });

  it("returns error if communicationType is invalid", () => {
    const errors = validateRewriteInput({ message: "Hello", communicationType: "whatsapp" });
    expect(errors.some(e => e.includes("communicationType must be one of"))).toBe(true);
  });

  it("does not return error if communicationType is valid", () => {
    const errors = validateRewriteInput({ message: "Hello", communicationType: "email" });
    expect(errors).toHaveLength(0);
  });

  it("returns error if recipient is invalid", () => {
    const errors = validateRewriteInput({ message: "Hello", recipient: "Friend" });
    expect(errors.some(e => e.includes("recipient must be one of"))).toBe(true);
  });

  it("does not return error if recipient is valid", () => {
    const errors = validateRewriteInput({ message: "Hello", recipient: "Manager" });
    expect(errors).toHaveLength(0);
  });

  it("returns error if subject is too long", () => {
    const longStr = "s".repeat(501);
    const errors = validateRewriteInput({ message: "Hello", subject: longStr });
    expect(errors.some(e => e.includes("subject exceeds maximum length"))).toBe(true);
  });

  it("returns error if model is too long", () => {
    const longStr = "m".repeat(201);
    const errors = validateRewriteInput({ message: "Hello", model: longStr });
    expect(errors.some(e => e.includes("model exceeds maximum length"))).toBe(true);
  });

  it("returns no errors for a valid complex payload", () => {
    const errors = validateRewriteInput({
      message: "Hello, this is a draft",
      tone: "Diplomatic",
      communicationType: "slack",
      recipient: "Client",
      subject: "Important update",
      model: "openrouter/free"
    });
    expect(errors).toHaveLength(0);
  });
});
