const dotenv = require("dotenv");
const path = require("path");

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const { generateRewrite } = require("../lib/openrouter.js");

async function test() {
  console.log("Using API Key:", process.env.OPENROUTER_API_KEY ? "Loaded" : "Missing");
  const result = await generateRewrite({
    message: "i hate this delay, fix it now! fail is unacceptable",
    communicationType: "email",
    recipient: "John",
    tone: "Professional",
    subject: "Project Delay",
  });
  console.log("Result returned:", JSON.stringify(result, null, 2));
}

test();
