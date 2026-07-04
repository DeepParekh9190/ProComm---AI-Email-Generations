/* eslint-disable @typescript-eslint/no-require-imports */
const { generateRewrite } = require("./openrouter");

describe("generateRewrite", () => {
  const originalApiKey = process.env.OPENROUTER_API_KEY;
  const originalFetch = global.fetch;

  beforeAll(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENROUTER_API_KEY = "test-api-key";
  });

  afterEach(() => {
    process.env.OPENROUTER_API_KEY = originalApiKey;
  });

  it("falls back to demo response if API key is missing or set to placeholder", async () => {
    process.env.OPENROUTER_API_KEY = "";
    const result = await generateRewrite({
      message: "Please do this ASAP",
      recipient: "John",
      tone: "Professional",
      communicationType: "email"
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result).toHaveProperty("rewrittenMessage");
    expect(result).toHaveProperty("originalTone", "Impatient");
    expect(result).toHaveProperty("newTone", "Professional");
    expect(result.rewrittenMessage).toContain("Dear John");
  });

  it("makes fetch request and returns rewritten output on API success", async () => {
    const mockApiResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              rewrittenMessage: "Dear John, please assist with this matter at your earliest convenience. Sincerely, [Your Name]",
              originalTone: "Impatient",
              newTone: "Professional",
              improvements: ["Changed urgent language to professional wording", "Added greeting and signoff"],
              alternatives: [
                { tone: "Diplomatic", preview: "Dear John..." }
              ]
            })
          }
        }
      ]
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse
    });

    const result = await generateRewrite({
      message: "Please do this ASAP",
      recipient: "John",
      tone: "Professional",
      communicationType: "email",
      model: "openrouter/free"
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
          "Content-Type": "application/json"
        }),
        body: expect.any(String)
      })
    );

    expect(result.rewrittenMessage).toContain("earliest convenience");
    expect(result.originalTone).toBe("Impatient");
    expect(result.improvements).toHaveLength(2);
    expect(result.alternatives).toHaveLength(1);
  });

  it("handles markdown code-blocked JSON in API response", async () => {
    const markdownContent = `\`\`\`json
    {
      "rewrittenMessage": "Dear John, please handle this. Sincerely, [Your Name]",
      "originalTone": "Impatient",
      "newTone": "Professional",
      "improvements": ["Formatted"],
      "alternatives": []
    }
    \`\`\``;

    const mockApiResponse = {
      choices: [
        {
          message: {
            content: markdownContent
          }
        }
      ]
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse
    });

    const result = await generateRewrite({
      message: "ASAP",
      recipient: "John",
      tone: "Professional"
    });

    expect(result.rewrittenMessage).toBe("Dear John, please handle this. Sincerely, [Your Name]");
    expect(result.originalTone).toBe("Impatient");
  });

  it("falls back gracefully if API response contains invalid JSON", async () => {
    const mockApiResponse = {
      choices: [
        {
          message: {
            content: "This is not a JSON object at all."
          }
        }
      ]
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse
    });

    const result = await generateRewrite({
      message: "Do this now!",
      recipient: "Sarah",
      tone: "Professional",
      communicationType: "email"
    });

    expect(result).toHaveProperty("rewrittenMessage");
    expect(result.originalTone).toBe("Aggressive");
    expect(result.rewrittenMessage).toContain("Dear Sarah");
  });

  it("falls back to demo response if fetch request fails", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network Error"));

    const result = await generateRewrite({
      message: "I am sorry for the delay",
      recipient: "Client",
      tone: "Diplomatic"
    });

    expect(result).toHaveProperty("rewrittenMessage");
    expect(result.originalTone).toBe("Apologetic");
    expect(result.newTone).toBe("Diplomatic");
  });

  it("falls back to demo response if fetch returns non-200 status", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429
    });

    const result = await generateRewrite({
      message: "Meeting at 5?",
      recipient: "Team",
      tone: "Professional"
    });

    expect(result).toHaveProperty("rewrittenMessage");
    expect(result.originalTone).toBe("Abrupt");
  });
});
