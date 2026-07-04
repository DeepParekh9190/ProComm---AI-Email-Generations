/* eslint-disable @typescript-eslint/no-require-imports */
const {
  detectOriginalTone,
  generateSmartFallback,
  getImprovements,
  generateAlternatives,
} = require("./fallback-engine");

describe("detectOriginalTone", () => {
  it("returns Aggressive for aggressive language", () => {
    expect(detectOriginalTone("This is unacceptable! I hate it")).toBe("Aggressive");
    expect(detectOriginalTone("I am very disappointed")).toBe("Aggressive");
    expect(detectOriginalTone("You are useless")).toBe("Aggressive");
  });

  it("returns Impatient for urgent language", () => {
    expect(detectOriginalTone("I need this right now")).toBe("Impatient");
    expect(detectOriginalTone("ASAP please")).toBe("Impatient");
    expect(detectOriginalTone("Hurry up")).toBe("Impatient");
  });

  it("returns Apologetic for apologetic language", () => {
    expect(detectOriginalTone("I am sorry for the mistake")).toBe("Apologetic");
    expect(detectOriginalTone("I apologize for the delay")).toBe("Apologetic");
    expect(detectOriginalTone("my bad")).toBe("Apologetic");
  });

  it("returns Polite / Casual for polite language", () => {
    expect(detectOriginalTone("Please could you help")).toBe("Polite / Casual");
    expect(detectOriginalTone("Thank you very much")).toBe("Polite / Casual");
    expect(detectOriginalTone("Hope you are well")).toBe("Polite / Casual");
  });

  it("returns Abrupt for very short messages", () => {
    expect(detectOriginalTone("Hi")).toBe("Abrupt");
    expect(detectOriginalTone("Ok")).toBe("Abrupt");
  });

  it("returns Unstructured / Informal for neutral messages", () => {
    expect(detectOriginalTone("This is a normal message about the project status")).toBe("Unstructured / Informal");
  });

  it("handles empty draft", () => {
    expect(detectOriginalTone("")).toBe("Abrupt");
    expect(detectOriginalTone()).toBe("Abrupt");
  });
});

describe("generateSmartFallback", () => {
  it("generates professional email by default", () => {
    const result = generateSmartFallback({ message: "This is a test", communicationType: "email", recipient: "John", tone: "Professional" });
    expect(result).toContain("Dear John");
    expect(result).toContain("Sincerely");
    expect(result).not.toContain("Subject:");
  });

  it("includes subject line when provided", () => {
    const result = generateSmartFallback({ message: "Test", subject: "Project Update" });
    expect(result).toContain("Subject: Project Update");
  });

  it("uses slack format for slack type", () => {
    const result = generateSmartFallback({ message: "Test", communicationType: "slack", recipient: "Sarah" });
    expect(result).toContain("Hey *Sarah*");
    expect(result).toContain("Let me know if this works!");
  });

  it("detects delay theme", () => {
    const result = generateSmartFallback({ message: "There is a delay in the timeline", recipient: "Manager" });
    expect(result).toContain("follow up on the status");
  });

  it("detects apology theme", () => {
    const result = generateSmartFallback({ message: "I apologize for the mistake", recipient: "Client" });
    expect(result).toContain("Please accept my sincere apologies");
  });

  it("detects meeting theme", () => {
    const result = generateSmartFallback({ message: "Let's schedule a meeting to discuss", recipient: "Team" });
    expect(result).toContain("schedule a time");
  });

  it("detects request theme", () => {
    const result = generateSmartFallback({ message: "Could you please send the report", recipient: "Colleague" });
    expect(result).toContain("request additional details");
  });

  it("handles empty message", () => {
    const result = generateSmartFallback({});
    expect(result).toContain("Hi Recipient");
  });
});

describe("getImprovements", () => {
  it("returns at least 2 improvements for any message", () => {
    const result = getImprovements("Normal message here");
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("detects aggressive punctuation", () => {
    const result = getImprovements("THIS IS BAD!");
    expect(result.some(i => i.includes("aggressive punctuation"))).toBe(true);
  });

  it("detects missing greeting", () => {
    const result = getImprovements("Just a quick note.");
    expect(result.some(i => i.includes("greeting"))).toBe(true);
  });

  it("detects negative language", () => {
    const result = getImprovements("This is unacceptable and I am disappointed.");
    expect(result.some(i => i.includes("unacceptable"))).toBe(true);
  });

  it("detects urgent language", () => {
    const result = getImprovements("I need this immediately.");
    expect(result.some(i => i.includes("urgency"))).toBe(true);
  });

  it("detects apologetic language", () => {
    const result = getImprovements("I am sorry for the mistake.");
    expect(result.some(i => i.includes("apologetic"))).toBe(true);
  });

  it("limits to 4 improvements", () => {
    const result = getImprovements("I am sorry. This is unacceptable! I am disappointed. ASAP. I apologize.");
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it("handles empty message", () => {
    const result = getImprovements("");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});

describe("generateAlternatives", () => {
  it("returns all tones except current", () => {
    const result = generateAlternatives({ message: "Test", currentTone: "Professional" });
    expect(result).toHaveLength(4);
    expect(result.find(a => a.tone === "Professional")).toBeUndefined();
  });

  it("each alternative has tone and preview", () => {
    const result = generateAlternatives({ message: "Test", currentTone: "Firm" });
    result.forEach(alt => {
      expect(alt).toHaveProperty("tone");
      expect(alt).toHaveProperty("preview");
      expect(typeof alt.preview).toBe("string");
    });
  });

  it("handles empty message", () => {
    const result = generateAlternatives({ message: "", currentTone: "Neutral" });
    expect(result).toHaveLength(4);
  });
});