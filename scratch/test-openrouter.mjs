import { generateRewrite } from "../lib/openrouter.js";

// Manually set key for local test
process.env.OPENROUTER_API_KEY = "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";

async function test() {
  console.log("Calling generateRewrite with openrouter/free...");
  try {
    const result = await generateRewrite({
      message: "i hate this delay, fix it now! fail is unacceptable",
      communicationType: "email",
      recipient: "John",
      tone: "Professional",
      subject: "Project Delay",
      model: "openrouter/free"
    });
    console.log("Result returned:\n", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Test error:", error);
  }
}

test();
