import fs from "fs";
import path from "path";

const LOG_FILE_PATH = path.join(process.cwd(), "src", "lib", "data", "telemetry_logs.json");
const PROMPT_FILE_PATH = path.join(process.cwd(), "src", "lib", "data", "prompt_settings.json");

function generateSeedLogs() {
  const seed = [];
  const tones = ["Professional", "Diplomatic", "Firm", "Empathetic", "Neutral"];
  const origTones = ["Aggressive", "Impatient", "Apologetic", "Abrupt", "Unstructured / Informal"];
  const commTypes = ["email", "slack", "client", "hr", "performance", "escalation"];
  const recipients = ["Employee", "Manager", "Client", "Vendor", "Partner"];
  const models = [
    "openrouter/free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "google/gemma-4-31b-it:free",
    "qwen/qwen3-coder:free"
  ];
  const emails = ["testuser@test.com", "admin@procomm.ai", "officialdeepparekh919@gmail.com", "user1@example.com", "user2@example.com"];
  
  const now = new Date();
  for (let i = 28; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 6 * 60 * 60 * 1000 - Math.random() * 3 * 60 * 60 * 1000);
    const isFallback = Math.random() < 0.15;
    const model = isFallback ? "fallback-engine" : models[Math.floor(Math.random() * models.length)];
    const pTokens = isFallback ? 0 : Math.floor(Math.random() * 400) + 120;
    const cTokens = isFallback ? 0 : Math.floor(Math.random() * 300) + 80;
    
    seed.push({
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timestamp.toISOString(),
      userId: "mock-uid-" + Math.floor(Math.random() * 5),
      userEmail: emails[Math.floor(Math.random() * emails.length)],
      originalTone: origTones[Math.floor(Math.random() * origTones.length)],
      newTone: tones[Math.floor(Math.random() * tones.length)],
      communicationType: commTypes[Math.floor(Math.random() * commTypes.length)],
      recipient: recipients[Math.floor(Math.random() * recipients.length)],
      model: model,
      latencyMs: isFallback ? Math.floor(Math.random() * 80) + 15 : Math.floor(Math.random() * 1400) + 600,
      promptTokens: pTokens,
      completionTokens: cTokens,
      isFallback: isFallback,
      draftSnippet: "This is a quick draft note to say that we need to finish this soon ASAP.",
      rewriteSnippet: "I am writing to kindly remind you that we should aim to complete this project at your earliest convenience."
    });
  }
  return seed;
}

function ensureFileExists(filePath, isLogs = false) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    const defaultContent = isLogs ? generateSeedLogs() : {};
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), "utf-8");
  }
}

export async function addTelemetryLog(entry) {
  try {
    ensureFileExists(LOG_FILE_PATH, true);
    const fileContent = await fs.promises.readFile(LOG_FILE_PATH, "utf-8");
    const logs = JSON.parse(fileContent || "[]");
    
    const newEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    
    logs.push(newEntry);
    
    if (logs.length > 500) {
      logs.shift();
    }
    
    await fs.promises.writeFile(LOG_FILE_PATH, JSON.stringify(logs, null, 2), "utf-8");
    return newEntry;
  } catch (error) {
    console.error("Failed to write telemetry log:", error);
    return null;
  }
}

export async function getTelemetryLogs() {
  try {
    ensureFileExists(LOG_FILE_PATH, true);
    const fileContent = await fs.promises.readFile(LOG_FILE_PATH, "utf-8");
    return JSON.parse(fileContent || "[]");
  } catch (error) {
    console.error("Failed to read telemetry logs:", error);
    return [];
  }
}

export async function getPromptSettings() {
  const defaultPrompt = `You are ProComm, an AI communication assistant. Your job is to rewrite the user's message to reflect the desired tone.

Given the user's draft: "{{message}}", communication type ({{communicationType}}), recipient ({{recipient}}), desired tone ({{tone}}), and subject ({{subject}}), do the following:

1. Detect the original tone of the user's message.
2. Rewrite the message directly and completely in the desired tone, including greeting, body, closing, and a signature line (e.g. "[Your Name]"). 
   CRITICAL CRITERIA: Do NOT reply to the message, do NOT quote the original text in quotes or blockquotes, and do NOT include intro/meta text such as "I wanted to touch base regarding your recent update:" or "Here is the rewritten version:". The rewritten message must stand on its own as a direct, seamless, and fully rewritten communication that is ready to be sent.
3. List 3-5 specific improvements made (e.g., specific wording adjustments, softening, or structure changes).
4. Generate alternative versions for all other available tones ({{targetTones}}). Each alternative MUST be a full, complete rewritten message including greeting, body, closing, and signature line, formatted for the selected communication type, ready to be sent.

Respond ONLY with valid JSON in this exact format, no other text:
{
  "rewrittenMessage": "the complete rewritten message",
  "originalTone": "detected original tone",
  "newTone": "{{tone}}",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "alternatives": [
    { "tone": "Tone1", "preview": "Dear Recipient,\\n\\n[Full message body rewritten in Tone1 tone here]\\n\\nSincerely,\\n[Your Name]" },
    { "tone": "Tone2", "preview": "Dear Recipient,\\n\\n[Full message body rewritten in Tone2 tone here]\\n\\nSincerely,\\n[Your Name]" },
    { "tone": "Tone3", "preview": "Dear Recipient,\\n\\n[Full message body rewritten in Tone3 tone here]\\n\\nSincerely,\\n[Your Name]" },
    { "tone": "Tone4", "preview": "Dear Recipient,\\n\\n[Full message body rewritten in Tone4 tone here]\\n\\nSincerely,\\n[Your Name]" }
  ]
}`;

  const defaultData = JSON.stringify({ systemPromptTemplate: defaultPrompt }, null, 2);
  
  try {
    ensureFileExists(PROMPT_FILE_PATH, false);
    const fileContent = await fs.promises.readFile(PROMPT_FILE_PATH, "utf-8");
    const parsed = JSON.parse(fileContent || "{}");
    if (!parsed.systemPromptTemplate) {
      parsed.systemPromptTemplate = defaultPrompt;
    }
    return parsed;
  } catch (error) {
    console.error("Failed to read prompt settings:", error);
    return { systemPromptTemplate: defaultPrompt };
  }
}

export async function updatePromptSettings(settings) {
  try {
    ensureFileExists(PROMPT_FILE_PATH, false);
    await fs.promises.writeFile(PROMPT_FILE_PATH, JSON.stringify(settings, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to write prompt settings:", error);
    return false;
  }
}
